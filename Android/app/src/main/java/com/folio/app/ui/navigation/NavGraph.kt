package com.folio.app.ui.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.*
import androidx.navigation.navArgument
import com.folio.app.ui.auth.AuthViewModel
import com.folio.app.ui.auth.LoginScreen
import com.folio.app.ui.auth.RegisterScreen
import com.folio.app.ui.auth.ForgotPasswordScreen
import com.folio.app.ui.home.HomeScreen
import com.folio.app.ui.project.ProjectDetailScreen
import com.folio.app.ui.project.ProjectsScreen
import com.folio.app.ui.project.UploadScreen
import com.folio.app.ui.search.SearchScreen
import com.folio.app.ui.profile.ProfileScreen
import com.folio.app.ui.profile.SettingsScreen
import com.folio.app.ui.collections.CollectionsScreen
import com.folio.app.ui.collections.CollectionDetailScreen
import com.folio.app.ui.challenges.ChallengesScreen
import com.folio.app.ui.challenges.ChallengeDetailScreen
import com.folio.app.ui.messages.ConversationsScreen
import com.folio.app.ui.messages.ChatScreen
import com.folio.app.ui.notifications.NotificationsScreen

sealed class Screen(val route: String) {
    object Login : Screen("login")
    object Register : Screen("register")
    object ForgotPassword : Screen("forgot_password")
    object Home : Screen("home")
    object Projects : Screen("projects")
    object Upload : Screen("upload")
    object Notifications : Screen("notifications")
    object Profile : Screen("profile/{username}") {
        fun create(username: String) = "profile/$username"
    }
    object ProjectDetail : Screen("project/{id}") {
        fun create(id: String) = "project/$id"
    }
    object Search : Screen("search")
    object Settings : Screen("settings")
    object Collections : Screen("collections")
    object CollectionDetail : Screen("collection/{id}") {
        fun create(id: String) = "collection/$id"
    }
    object Challenges : Screen("challenges")
    object ChallengeDetail : Screen("challenge/{id}") {
        fun create(id: String) = "challenge/$id"
    }
    object Conversations : Screen("conversations")
    object Chat : Screen("chat/{userId}/{name}") {
        fun create(userId: String, name: String) = "chat/$userId/$name"
    }
}

data class BottomNavItem(
    val label: String,
    val icon: ImageVector,
    val route: String
)

@Composable
fun FolioNavHost() {
    val authViewModel: AuthViewModel = hiltViewModel()
    val authState by authViewModel.authState.collectAsState()
    val navController = rememberNavController()

    val bottomItems = listOf(
        BottomNavItem("Главная", Icons.Default.Home, Screen.Home.route),
        BottomNavItem("Проекты", Icons.Default.GridView, Screen.Projects.route),
        BottomNavItem("Загрузить", Icons.Default.AddCircle, Screen.Upload.route),
        BottomNavItem("Уведомления", Icons.Default.Notifications, Screen.Notifications.route),
        BottomNavItem("Профиль", Icons.Default.Person, "my_profile"),
    )

    val showBottomBar = authState is AuthViewModel.AuthState.Authenticated

    Scaffold(
        bottomBar = {
            if (showBottomBar) {
                val navBackStackEntry by navController.currentBackStackEntryAsState()
                val currentRoute = navBackStackEntry?.destination?.route

                NavigationBar {
                    bottomItems.forEach { item ->
                        NavigationBarItem(
                            selected = currentRoute == item.route ||
                                (item.route == "my_profile" && currentRoute?.startsWith("profile/") == true),
                            onClick = {
                                val route = if (item.route == "my_profile") {
                                    val user = (authState as? AuthViewModel.AuthState.Authenticated)?.user
                                    Screen.Profile.create(user?.username ?: "")
                                } else item.route

                                navController.navigate(route) {
                                    popUpTo(Screen.Home.route) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = { Icon(item.icon, contentDescription = item.label) },
                            label = { Text(item.label, style = MaterialTheme.typography.labelSmall) }
                        )
                    }
                }
            }
        }
    ) { padding ->
        NavHost(
            navController = navController,
            startDestination = when (authState) {
                is AuthViewModel.AuthState.Authenticated -> Screen.Home.route
                else -> Screen.Login.route
            },
            modifier = Modifier.padding(padding)
        ) {
            // Auth
            composable(Screen.Login.route) {
                LoginScreen(
                    viewModel = authViewModel,
                    onRegister = { navController.navigate(Screen.Register.route) },
                    onForgotPassword = { navController.navigate(Screen.ForgotPassword.route) }
                )
            }
            composable(Screen.Register.route) {
                RegisterScreen(
                    viewModel = authViewModel,
                    onLogin = { navController.popBackStack() }
                )
            }
            composable(Screen.ForgotPassword.route) {
                ForgotPasswordScreen(
                    viewModel = authViewModel,
                    onBack = { navController.popBackStack() }
                )
            }

            // Main
            composable(Screen.Home.route) {
                HomeScreen(navController = navController)
            }
            composable(Screen.Projects.route) {
                ProjectsScreen(navController = navController)
            }
            composable(Screen.Upload.route) {
                UploadScreen(navController = navController)
            }
            composable(Screen.Notifications.route) {
                NotificationsScreen(navController = navController)
            }
            composable(Screen.Search.route) {
                SearchScreen(navController = navController)
            }
            composable(Screen.Settings.route) {
                SettingsScreen(
                    authViewModel = authViewModel,
                    onLogout = {
                        navController.navigate(Screen.Login.route) {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                )
            }

            // Detail screens
            composable(
                Screen.Profile.route,
                arguments = listOf(navArgument("username") { type = NavType.StringType })
            ) { entry ->
                ProfileScreen(
                    username = entry.arguments?.getString("username") ?: "",
                    navController = navController,
                    authViewModel = authViewModel
                )
            }
            composable(
                Screen.ProjectDetail.route,
                arguments = listOf(navArgument("id") { type = NavType.StringType })
            ) { entry ->
                ProjectDetailScreen(
                    projectId = entry.arguments?.getString("id") ?: "",
                    navController = navController
                )
            }
            composable(Screen.Collections.route) {
                CollectionsScreen(navController = navController)
            }
            composable(
                Screen.CollectionDetail.route,
                arguments = listOf(navArgument("id") { type = NavType.StringType })
            ) { entry ->
                CollectionDetailScreen(
                    collectionId = entry.arguments?.getString("id") ?: "",
                    navController = navController
                )
            }
            composable(Screen.Challenges.route) {
                ChallengesScreen(navController = navController)
            }
            composable(
                Screen.ChallengeDetail.route,
                arguments = listOf(navArgument("id") { type = NavType.StringType })
            ) { entry ->
                ChallengeDetailScreen(
                    challengeId = entry.arguments?.getString("id") ?: "",
                    navController = navController
                )
            }
            composable(Screen.Conversations.route) {
                ConversationsScreen(navController = navController)
            }
            composable(
                Screen.Chat.route,
                arguments = listOf(
                    navArgument("userId") { type = NavType.StringType },
                    navArgument("name") { type = NavType.StringType }
                )
            ) { entry ->
                ChatScreen(
                    recipientId = entry.arguments?.getString("userId") ?: "",
                    recipientName = entry.arguments?.getString("name") ?: "",
                    navController = navController
                )
            }
        }
    }
}
