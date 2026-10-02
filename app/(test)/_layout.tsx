import {Stack, Tabs} from "expo-router";

export default function ProfileLayout() {
    return (
        <Tabs>
            <Tabs.Screen name="CourierHomeScreen" options={{ headerShown: false }} />
            <Tabs.Screen name="EarningsScreen" options={{ headerShown: false }} />
            <Tabs.Screen name="OrderCards" options={{ headerShown: false }} />
            <Tabs.Screen name="OrderHistoryScreen" options={{ headerShown: false }} />
        </Tabs>
    );
}
