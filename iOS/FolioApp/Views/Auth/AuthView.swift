import SwiftUI

struct AuthView: View {
    @State private var mode: AuthMode = .login

    enum AuthMode {
        case login, register, forgotPassword
    }

    var body: some View {
        NavigationStack {
            VStack {
                switch mode {
                case .login:
                    LoginView(switchTo: { mode = $0 })
                case .register:
                    RegisterView(switchTo: { mode = $0 })
                case .forgotPassword:
                    ForgotPasswordView(switchTo: { mode = $0 })
                }
            }
        }
    }
}

struct LoginView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @State private var email = ""
    @State private var password = ""
    let switchTo: (AuthView.AuthMode) -> Void

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                VStack(spacing: 8) {
                    Text("Вход")
                        .font(.largeTitle.bold())
                    Text("Войдите в свой аккаунт Folio")
                        .foregroundColor(.secondary)
                }
                .padding(.top, 40)

                VStack(spacing: 16) {
                    TextField("Email", text: $email)
                        .keyboardType(.emailAddress)
                        .textContentType(.emailAddress)
                        .autocapitalization(.none)
                        .textFieldStyle(.roundedBorder)

                    SecureField("Пароль", text: $password)
                        .textContentType(.password)
                        .textFieldStyle(.roundedBorder)
                }

                if let error = authVM.error {
                    Text(error)
                        .foregroundColor(.red)
                        .font(.caption)
                        .multilineTextAlignment(.center)
                }

                Button {
                    Task { await authVM.login(email: email, password: password) }
                } label: {
                    if authVM.isLoading {
                        ProgressView()
                            .frame(maxWidth: .infinity)
                    } else {
                        Text("Войти")
                            .frame(maxWidth: .infinity)
                    }
                }
                .buttonStyle(.borderedProminent)
                .disabled(email.isEmpty || password.isEmpty || authVM.isLoading)

                Button("Забыли пароль?") {
                    switchTo(.forgotPassword)
                }
                .font(.caption)

                HStack {
                    Text("Нет аккаунта?")
                        .foregroundColor(.secondary)
                    Button("Зарегистрироваться") {
                        switchTo(.register)
                    }
                }
                .font(.callout)
            }
            .padding(.horizontal, 24)
        }
    }
}

struct RegisterView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @State private var username = ""
    @State private var email = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    let switchTo: (AuthView.AuthMode) -> Void

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                VStack(spacing: 8) {
                    Text("Регистрация")
                        .font(.largeTitle.bold())
                    Text("Создайте аккаунт на Folio")
                        .foregroundColor(.secondary)
                }
                .padding(.top, 40)

                if authVM.verificationSent {
                    VStack(spacing: 16) {
                        Image(systemName: "envelope.badge.fill")
                            .font(.system(size: 60))
                            .foregroundColor(.blue)
                        Text("Проверьте почту!")
                            .font(.title2.bold())
                        Text("Мы отправили письмо для подтверждения на \(email)")
                            .multilineTextAlignment(.center)
                            .foregroundColor(.secondary)

                        Button("Отправить повторно") {
                            Task { await authVM.resendVerification(email: email) }
                        }
                        .buttonStyle(.bordered)

                        Button("Войти") {
                            authVM.verificationSent = false
                            switchTo(.login)
                        }
                        .buttonStyle(.borderedProminent)
                    }
                } else {
                    VStack(spacing: 16) {
                        TextField("Имя пользователя", text: $username)
                            .textContentType(.username)
                            .autocapitalization(.none)
                            .textFieldStyle(.roundedBorder)

                        TextField("Email", text: $email)
                            .keyboardType(.emailAddress)
                            .textContentType(.emailAddress)
                            .autocapitalization(.none)
                            .textFieldStyle(.roundedBorder)

                        SecureField("Пароль", text: $password)
                            .textContentType(.newPassword)
                            .textFieldStyle(.roundedBorder)

                        SecureField("Подтвердите пароль", text: $confirmPassword)
                            .textContentType(.newPassword)
                            .textFieldStyle(.roundedBorder)
                    }

                    if let error = authVM.error {
                        Text(error)
                            .foregroundColor(.red)
                            .font(.caption)
                            .multilineTextAlignment(.center)
                    }

                    if password != confirmPassword && !confirmPassword.isEmpty {
                        Text("Пароли не совпадают")
                            .foregroundColor(.red)
                            .font(.caption)
                    }

                    Button {
                        Task { await authVM.register(username: username, email: email, password: password) }
                    } label: {
                        if authVM.isLoading {
                            ProgressView()
                                .frame(maxWidth: .infinity)
                        } else {
                            Text("Зарегистрироваться")
                                .frame(maxWidth: .infinity)
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(username.isEmpty || email.isEmpty || password.isEmpty || password != confirmPassword || authVM.isLoading)

                    HStack {
                        Text("Уже есть аккаунт?")
                            .foregroundColor(.secondary)
                        Button("Войти") {
                            switchTo(.login)
                        }
                    }
                    .font(.callout)
                }
            }
            .padding(.horizontal, 24)
        }
    }
}

struct ForgotPasswordView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @State private var email = ""
    let switchTo: (AuthView.AuthMode) -> Void

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                VStack(spacing: 8) {
                    Text("Восстановление пароля")
                        .font(.title.bold())
                    Text("Введите email для сброса пароля")
                        .foregroundColor(.secondary)
                }
                .padding(.top, 40)

                if authVM.resetSent {
                    VStack(spacing: 16) {
                        Image(systemName: "envelope.fill")
                            .font(.system(size: 60))
                            .foregroundColor(.green)
                        Text("Письмо отправлено!")
                            .font(.title2.bold())
                        Text("Проверьте почту для инструкций по сбросу пароля")
                            .multilineTextAlignment(.center)
                            .foregroundColor(.secondary)

                        Button("Вернуться ко входу") {
                            authVM.resetSent = false
                            switchTo(.login)
                        }
                        .buttonStyle(.borderedProminent)
                    }
                } else {
                    TextField("Email", text: $email)
                        .keyboardType(.emailAddress)
                        .textContentType(.emailAddress)
                        .autocapitalization(.none)
                        .textFieldStyle(.roundedBorder)

                    if let error = authVM.error {
                        Text(error)
                            .foregroundColor(.red)
                            .font(.caption)
                    }

                    Button {
                        Task { await authVM.forgotPassword(email: email) }
                    } label: {
                        if authVM.isLoading {
                            ProgressView().frame(maxWidth: .infinity)
                        } else {
                            Text("Отправить").frame(maxWidth: .infinity)
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(email.isEmpty || authVM.isLoading)

                    Button("Вернуться ко входу") {
                        switchTo(.login)
                    }
                    .font(.callout)
                }
            }
            .padding(.horizontal, 24)
        }
    }
}
