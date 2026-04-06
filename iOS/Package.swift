// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "FolioApp",
    platforms: [.iOS(.v16)],
    products: [
        .library(name: "FolioApp", targets: ["FolioApp"])
    ],
    targets: [
        .target(name: "FolioApp", path: "FolioApp")
    ]
)
