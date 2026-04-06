import SwiftUI
import PhotosUI

struct SettingsView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @StateObject private var vm = SettingsViewModel()
    @State private var selectedPhoto: PhotosPickerItem?
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                Section("Профиль") {
                    TextField("Отображаемое имя", text: $vm.displayName)
                    TextField("О себе", text: $vm.bio, axis: .vertical)
                        .lineLimit(2...5)
                    TextField("Сайт", text: $vm.website)
                        .keyboardType(.URL)
                        .autocapitalization(.none)
                    TextField("Местоположение", text: $vm.location)
                }

                Section("Аватар") {
                    PhotosPicker(selection: $selectedPhoto, matching: .images) {
                        Label("Изменить аватар", systemImage: "camera")
                    }
                    .onChange(of: selectedPhoto) { item in
                        guard let item else { return }
                        Task {
                            if let data = try? await item.loadTransferable(type: Data.self) {
                                if let user = await vm.uploadAvatar(imageData: data) {
                                    authVM.state = .authenticated(user)
                                }
                            }
                        }
                    }
                }

                if let error = vm.error {
                    Section {
                        Text(error).foregroundColor(.red)
                    }
                }

                if vm.saved {
                    Section {
                        Text("Сохранено!").foregroundColor(.green)
                    }
                }

                Section {
                    Button {
                        Task {
                            if let user = await vm.save() {
                                authVM.state = .authenticated(user)
                            }
                        }
                    } label: {
                        HStack {
                            if vm.isSaving { ProgressView() }
                            Text("Сохранить")
                        }
                        .frame(maxWidth: .infinity)
                    }
                    .disabled(vm.isSaving)
                }

                Section {
                    Button("Выйти", role: .destructive) {
                        authVM.logout()
                        dismiss()
                    }
                }
            }
            .navigationTitle("Настройки")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Готово") { dismiss() }
                }
            }
            .onAppear {
                if let user = authVM.currentUser {
                    vm.loadProfile(user)
                }
            }
        }
    }
}
