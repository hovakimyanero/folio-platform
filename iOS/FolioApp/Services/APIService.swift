import Foundation

enum APIError: LocalizedError {
    case network(Error)
    case server(String)
    case decodingFailed
    case unauthorized
    case unknown

    var errorDescription: String? {
        switch self {
        case .network(let err): return err.localizedDescription
        case .server(let msg): return msg
        case .decodingFailed: return "Ошибка обработки данных"
        case .unauthorized: return "Необходима авторизация"
        case .unknown: return "Неизвестная ошибка"
        }
    }
}

actor APIService {
    static let shared = APIService()
    private let baseURL = APIConfig.baseURL
    private let decoder: JSONDecoder = {
        let d = JSONDecoder()
        d.keyDecodingStrategy = .useDefaultKeys
        return d
    }()

    private init() {}

    // MARK: - Core Request

    func request<T: Decodable>(
        _ method: String,
        _ path: String,
        body: Any? = nil,
        query: [String: String]? = nil,
        auth: Bool = true
    ) async throws -> T {
        var urlString = "\(baseURL)\(path)"
        if let query, !query.isEmpty {
            let qs = query.map { "\($0.key)=\($0.value.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? $0.value)" }.joined(separator: "&")
            urlString += "?\(qs)"
        }

        guard let url = URL(string: urlString) else { throw APIError.unknown }
        var req = URLRequest(url: url)
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if auth, let token = KeychainService.accessToken {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        if let body {
            req.httpBody = try JSONSerialization.data(withJSONObject: body)
        }

        let (data, response) = try await URLSession.shared.data(for: req)
        guard let http = response as? HTTPURLResponse else { throw APIError.unknown }

        if http.statusCode == 401 {
            // Try refresh
            if auth, let refreshed = try? await refreshToken() {
                KeychainService.accessToken = refreshed
                req.setValue("Bearer \(refreshed)", forHTTPHeaderField: "Authorization")
                let (data2, response2) = try await URLSession.shared.data(for: req)
                guard let http2 = response2 as? HTTPURLResponse else { throw APIError.unknown }
                if http2.statusCode >= 400 {
                    throw try extractError(data: data2, status: http2.statusCode)
                }
                return try decoder.decode(T.self, from: data2)
            }
            throw APIError.unauthorized
        }

        if http.statusCode >= 400 {
            throw try extractError(data: data, status: http.statusCode)
        }

        return try decoder.decode(T.self, from: data)
    }

    // MARK: - Raw request (no decoding)

    func requestRaw(
        _ method: String,
        _ path: String,
        body: Any? = nil,
        auth: Bool = true
    ) async throws -> Data {
        let urlString = "\(baseURL)\(path)"
        guard let url = URL(string: urlString) else { throw APIError.unknown }
        var req = URLRequest(url: url)
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if auth, let token = KeychainService.accessToken {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        if let body {
            req.httpBody = try JSONSerialization.data(withJSONObject: body)
        }
        let (data, response) = try await URLSession.shared.data(for: req)
        guard let http = response as? HTTPURLResponse else { throw APIError.unknown }
        if http.statusCode >= 400 {
            throw try extractError(data: data, status: http.statusCode)
        }
        return data
    }

    // MARK: - Upload to presigned URL

    func uploadToPresigned(url: String, data: Data, contentType: String) async throws {
        guard let uploadURL = URL(string: url) else { throw APIError.unknown }
        var req = URLRequest(url: uploadURL)
        req.httpMethod = "PUT"
        req.setValue(contentType, forHTTPHeaderField: "Content-Type")
        let (_, response) = try await URLSession.shared.upload(for: req, from: data)
        guard let http = response as? HTTPURLResponse, http.statusCode < 400 else {
            throw APIError.server("Ошибка загрузки файла")
        }
    }

    // Upload multipart (for avatar/cover)
    func uploadMultipart(
        _ path: String,
        fields: [String: String],
        files: [(name: String, filename: String, mime: String, data: Data)]
    ) async throws -> Data {
        let boundary = UUID().uuidString
        let urlString = "\(baseURL)\(path)"
        guard let url = URL(string: urlString) else { throw APIError.unknown }
        var req = URLRequest(url: url)
        req.httpMethod = "PATCH"
        req.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        if let token = KeychainService.accessToken {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        var body = Data()
        for (key, val) in fields {
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"\(key)\"\r\n\r\n".data(using: .utf8)!)
            body.append("\(val)\r\n".data(using: .utf8)!)
        }
        for file in files {
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"\(file.name)\"; filename=\"\(file.filename)\"\r\n".data(using: .utf8)!)
            body.append("Content-Type: \(file.mime)\r\n\r\n".data(using: .utf8)!)
            body.append(file.data)
            body.append("\r\n".data(using: .utf8)!)
        }
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)
        req.httpBody = body

        let (data, response) = try await URLSession.shared.data(for: req)
        guard let http = response as? HTTPURLResponse, http.statusCode < 400 else {
            throw try extractError(data: data, status: (response as? HTTPURLResponse)?.statusCode ?? 500)
        }
        return data
    }

    // MARK: - Helpers

    private func refreshToken() async throws -> String? {
        guard let rt = KeychainService.refreshToken else { return nil }
        let body = ["refreshToken": rt]
        let urlString = "\(baseURL)/auth/refresh"
        guard let url = URL(string: urlString) else { return nil }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: req)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else { return nil }
        let result = try decoder.decode(AuthResponse.self, from: data)
        if let newRefresh = extractRefreshFromResponse(data) {
            KeychainService.refreshToken = newRefresh
        }
        return result.accessToken
    }

    private func extractRefreshFromResponse(_ data: Data) -> String? {
        guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { return nil }
        return json["refreshToken"] as? String
    }

    private func extractError(data: Data, status: Int) throws -> APIError {
        if let errResp = try? decoder.decode(ErrorResponse.self, from: data) {
            return .server(errResp.error.message)
        }
        return .server("Ошибка сервера (\(status))")
    }
}

// Convenience methods
extension APIService {
    func get<T: Decodable>(_ path: String, query: [String: String]? = nil, auth: Bool = true) async throws -> T {
        try await request("GET", path, query: query, auth: auth)
    }

    func post<T: Decodable>(_ path: String, body: Any? = nil, auth: Bool = true) async throws -> T {
        try await request("POST", path, body: body, auth: auth)
    }

    func patch<T: Decodable>(_ path: String, body: Any? = nil) async throws -> T {
        try await request("PATCH", path, body: body)
    }

    func delete(_ path: String) async throws {
        _ = try await requestRaw("DELETE", path)
    }
}
