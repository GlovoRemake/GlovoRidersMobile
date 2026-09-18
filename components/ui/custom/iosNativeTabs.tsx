import { NativeTabs } from "expo-router/unstable-native-tabs";

export default function IOSNativeTabs() {
    return (
        <NativeTabs
            indicatorColor="#FFF1CC"
            tintColor="#F5A623"
            labelStyle={{
                color: "#9A9A9A",
                fontSize: 10,
                fontWeight: "600",
                fontFamily: "Nunito",
            }}
        >
            <NativeTabs.Trigger name="index">
                <NativeTabs.Trigger.Label>Головна</NativeTabs.Trigger.Label>
                <NativeTabs.Trigger.Icon
                    sf={{ default: "house", selected: "house.fill" }}
                    md={{ default: "home", selected: "home" }}
                />
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="explore">
                <NativeTabs.Trigger.Label>Спробувати</NativeTabs.Trigger.Label>
                <NativeTabs.Trigger.Icon
                    sf={{ default: "magnifyingglass", selected: "magnifyingglass" }}
                    md={{ default: "search", selected: "search" }}
                />
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="profile">
                <NativeTabs.Trigger.Label>Профіль</NativeTabs.Trigger.Label>
                <NativeTabs.Trigger.Icon
                    sf={{ default: "person", selected: "person.fill" }}
                    md={{ default: "person", selected: "person" }}
                />
            </NativeTabs.Trigger>
        </NativeTabs>
    );
}