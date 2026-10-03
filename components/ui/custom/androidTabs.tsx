import { Tabs } from "expo-router";
import {Home, Layers, Search, User, Wallet} from "lucide-react-native";
import { useColorScheme } from "react-native";

export default function AndroidTabs() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: "#FFC244",
                tabBarInactiveTintColor: isDark ? "#777777" : "#999999",
                tabBarStyle: {
                    position: "absolute",
                    height: 72,
                    width: "90%",
                    paddingTop: 8,
                    paddingBottom: 12,
                    paddingLeft: 12,
                    paddingRight: 12,
                    marginLeft: "5%",
                    bottom: 22,
                    backgroundColor: isDark ? "#181818" : "#FFFFFF",
                    borderTopWidth: 0,
                    elevation: isDark ? 8 : 5,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: isDark ? 0.35 : 0.1,
                    shadowRadius: 8,
                    borderRadius: 80,
                },
                tabBarLabelStyle: {
                    fontFamily: "Nunito",
                    fontSize: 10,
                    fontWeight: "600",
                },
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: "Головна",
                    tabBarIcon: ({ color }) => <Layers color={color} size={20} />,
                }}
            />
            <Tabs.Screen
                name="earning"
                options={{
                    title: "Гаманець",
                    tabBarIcon: ({ color }) => <Wallet color={color} size={20} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Профіль",
                    tabBarIcon: ({ color }) => <User color={color} size={20} />,
                }}
            />
            <Tabs.Screen
                name="updateProfile"
                options={{ href: null }}
            />
        </Tabs>
    );
}