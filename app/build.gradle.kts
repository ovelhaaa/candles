plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.aistudio.reverb"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.aistudio.reverb"
        minSdk = 26
        targetSdk = 36
        versionCode = 1
        versionName = "1.0"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_21
        targetCompatibility = JavaVersion.VERSION_21
    }
    kotlinOptions {
        jvmTarget = "21"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.webkit:webkit:1.12.1")
}

val buildWebAssets by tasks.registering(Exec::class) {
    workingDir(rootDir)
    commandLine("npm", "run", "build")
}

val copyWebAssets by tasks.registering(Copy::class) {
    dependsOn(buildWebAssets)
    from(File(rootDir, "dist"))
    into(File(rootDir, "app/src/main/assets/www"))
}

tasks.named("preBuild") {
    dependsOn(copyWebAssets)
}
