import Foundation
import SwiftUI
import PhotosUI

@MainActor
class UploadViewModel: ObservableObject {
    @Published var title = ""
    @Published var description = ""
    @Published var category = ""
    @Published var tags = ""
    @Published var selectedImages: [Data] = []
    @Published var coverIndex = 0
    @Published var isUploading = false
    @Published var uploadProgress = ""
    @Published var error: String?
    @Published var uploadedProject: Project?

    let categories = [
        "Графический дизайн", "UI/UX", "Иллюстрация", "3D",
        "Моушн-дизайн", "Фотография", "Веб-дизайн", "Брендинг"
    ]

    private let api = APIService.shared

    func upload() async {
        guard !title.isEmpty, !selectedImages.isEmpty, !category.isEmpty else {
            error = "Заполните все обязательные поля"
            return
        }

        isUploading = true
        error = nil

        do {
            // Step 1: Get presigned URLs
            let files = selectedImages.enumerated().map { (i, _) -> [String: String] in
                ["filename": "image_\(i).jpg", "contentType": "image/jpeg"]
            }
            let presignBody: [String: Any] = ["files": files]
            let presignResp: PresignResponse = try await api.post("/projects/presign", body: presignBody)

            // Step 2: Upload each image to S3
            var uploadedUrls: [String] = []
            for (i, upload) in presignResp.uploads.enumerated() {
                uploadProgress = "Загрузка \(i + 1) из \(presignResp.uploads.count)..."
                try await api.uploadToPresigned(url: upload.uploadUrl, data: selectedImages[i], contentType: "image/jpeg")
                uploadedUrls.append(upload.fileUrl)
            }

            // Step 3: Create project
            let createBody: [String: Any] = [
                "title": title,
                "description": description,
                "category": category,
                "tags": tags.components(separatedBy: ",").map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty },
                "mediaUrls": uploadedUrls,
                "coverUrl": uploadedUrls[min(coverIndex, uploadedUrls.count - 1)]
            ]

            let project: Project = try await api.post("/projects/create", body: createBody)
            uploadedProject = project
            uploadProgress = "Готово!"
        } catch let err as APIError {
            error = err.errorDescription
        } catch {
            self.error = error.localizedDescription
        }
        isUploading = false
    }

    func reset() {
        title = ""
        description = ""
        category = ""
        tags = ""
        selectedImages = []
        coverIndex = 0
        error = nil
        uploadedProject = nil
        uploadProgress = ""
    }
}
