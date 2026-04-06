import SwiftUI
import PhotosUI

struct UploadView: View {
    @StateObject private var vm = UploadViewModel()
    @EnvironmentObject var authVM: AuthViewModel
    @State private var selectedItems: [PhotosPickerItem] = []
    @State private var showSuccess = false

    var body: some View {
        NavigationStack {
            if !authVM.isAuthenticated {
                VStack(spacing: 16) {
                    Image(systemName: "arrow.up.circle")
                        .font(.system(size: 60))
                        .foregroundColor(.gray)
                    Text("Войдите, чтобы загрузить проект")
                        .foregroundColor(.secondary)
                }
            } else if showSuccess, let project = vm.uploadedProject {
                VStack(spacing: 20) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 60))
                        .foregroundColor(.green)
                    Text("Проект загружен!")
                        .font(.title2.bold())
                    NavigationLink("Посмотреть проект") {
                        ProjectDetailView(projectId: project.id)
                    }
                    .buttonStyle(.borderedProminent)
                    Button("Загрузить ещё") {
                        vm.reset()
                        selectedItems = []
                        showSuccess = false
                    }
                    .buttonStyle(.bordered)
                }
            } else {
                Form {
                    Section("Изображения") {
                        PhotosPicker(selection: $selectedItems, maxSelectionCount: 10, matching: .images) {
                            HStack {
                                Image(systemName: "photo.on.rectangle.angled")
                                Text(vm.selectedImages.isEmpty ? "Выбрать изображения" : "\(vm.selectedImages.count) выбрано")
                            }
                        }
                        .onChange(of: selectedItems) { items in
                            Task {
                                var images: [Data] = []
                                for item in items {
                                    if let data = try? await item.loadTransferable(type: Data.self) {
                                        images.append(data)
                                    }
                                }
                                vm.selectedImages = images
                            }
                        }

                        if !vm.selectedImages.isEmpty {
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 8) {
                                    ForEach(vm.selectedImages.indices, id: \.self) { i in
                                        ZStack(alignment: .topTrailing) {
                                            if let uiImage = UIImage(data: vm.selectedImages[i]) {
                                                Image(uiImage: uiImage)
                                                    .resizable()
                                                    .aspectRatio(contentMode: .fill)
                                                    .frame(width: 80, height: 80)
                                                    .cornerRadius(8)
                                                    .clipped()
                                            }
                                            if vm.coverIndex == i {
                                                Text("Обл.")
                                                    .font(.caption2)
                                                    .padding(2)
                                                    .background(Color.blue)
                                                    .foregroundColor(.white)
                                                    .cornerRadius(4)
                                            }
                                        }
                                        .onTapGesture {
                                            vm.coverIndex = i
                                        }
                                    }
                                }
                            }
                            Text("Нажмите на изображение, чтобы выбрать обложку")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }

                    Section("Информация") {
                        TextField("Название *", text: $vm.title)
                        TextField("Описание", text: $vm.description, axis: .vertical)
                            .lineLimit(3...6)

                        Picker("Категория *", selection: $vm.category) {
                            Text("Выберите").tag("")
                            ForEach(vm.categories, id: \.self) { cat in
                                Text(cat).tag(cat)
                            }
                        }

                        TextField("Теги (через запятую)", text: $vm.tags)
                    }

                    if let error = vm.error {
                        Section {
                            Text(error)
                                .foregroundColor(.red)
                        }
                    }

                    Section {
                        Button {
                            Task {
                                await vm.upload()
                                if vm.uploadedProject != nil {
                                    showSuccess = true
                                }
                            }
                        } label: {
                            HStack {
                                if vm.isUploading {
                                    ProgressView()
                                    Text(vm.uploadProgress)
                                } else {
                                    Text("Опубликовать")
                                }
                            }
                            .frame(maxWidth: .infinity)
                        }
                        .disabled(vm.isUploading || vm.title.isEmpty || vm.selectedImages.isEmpty || vm.category.isEmpty)
                    }
                }
                .navigationTitle("Загрузить проект")
            }
        }
    }
}
