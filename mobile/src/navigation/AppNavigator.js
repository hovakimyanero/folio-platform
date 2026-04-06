import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';

import HomeScreen from '../screens/Home/HomeScreen';
import FeedScreen from '../screens/Feed/FeedScreen';
import AnalyticsScreen from '../screens/Analytics/AnalyticsScreen';
import ProjectsScreen from '../screens/Projects/ProjectsScreen';
import ProjectDetailScreen from '../screens/Projects/ProjectDetailScreen';
import UploadScreen from '../screens/Upload/UploadScreen';
import SearchScreen from '../screens/Search/SearchScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import SettingsScreen from '../screens/Profile/SettingsScreen';
import CollectionsScreen from '../screens/Collections/CollectionsScreen';
import CollectionDetailScreen from '../screens/Collections/CollectionDetailScreen';
import ChallengesScreen from '../screens/Challenges/ChallengesScreen';
import ChallengeDetailScreen from '../screens/Challenges/ChallengeDetailScreen';
import ConversationsScreen from '../screens/Messages/ConversationsScreen';
import ChatScreen from '../screens/Messages/ChatScreen';
import NotificationsScreen from '../screens/Notifications/NotificationsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#6C5CE7',
        tabBarIcon: ({ color, size }) => {
          const icons = {
            HomeTab: 'home',
            FeedTab: 'sparkles',
            UploadTab: 'add-circle',
            NotificationsTab: 'notifications',
            ProfileTab: 'person',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ tabBarLabel: 'Главная' }} />
      <Tab.Screen name="FeedTab" component={FeedScreen} options={{ tabBarLabel: 'Лента' }} />
      <Tab.Screen name="UploadTab" component={UploadScreen} options={{ tabBarLabel: 'Загрузить' }} />
      <Tab.Screen name="NotificationsTab" component={NotificationsScreen} options={{ tabBarLabel: 'Уведомления' }} />
      <Tab.Screen name="ProfileTab" component={MyProfileScreen} options={{ tabBarLabel: 'Профиль' }} />
    </Tab.Navigator>
  );
}

function MyProfileScreen({ navigation }) {
  const { user } = useAuth();
  return <ProfileScreen navigation={navigation} route={{ params: { username: user?.username } }} />;
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerBackTitle: 'Назад' }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Регистрация' }} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Восстановление' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={HomeTabs} options={{ headerShown: false }} />
            <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} options={{ title: 'Проект' }} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Профиль' }} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Настройки' }} />
            <Stack.Screen name="Search" component={SearchScreen} options={{ title: 'Поиск' }} />
            <Stack.Screen name="Feed" component={FeedScreen} options={{ title: 'Лента' }} />
            <Stack.Screen name="Analytics" component={AnalyticsScreen} options={{ title: 'Аналитика' }} />
            <Stack.Screen name="Projects" component={ProjectsScreen} options={{ title: 'Проекты' }} />
            <Stack.Screen name="Collections" component={CollectionsScreen} options={{ title: 'Коллекции' }} />
            <Stack.Screen name="CollectionDetail" component={CollectionDetailScreen} options={{ title: 'Коллекция' }} />
            <Stack.Screen name="Challenges" component={ChallengesScreen} options={{ title: 'Челленджи' }} />
            <Stack.Screen name="ChallengeDetail" component={ChallengeDetailScreen} options={{ title: 'Челлендж' }} />
            <Stack.Screen name="Conversations" component={ConversationsScreen} options={{ title: 'Сообщения' }} />
            <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Чат' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
