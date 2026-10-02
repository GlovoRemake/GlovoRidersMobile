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
            <NativeTabs.Trigger name="home">
                <NativeTabs.Trigger.Label>Замовлення</NativeTabs.Trigger.Label>
                <NativeTabs.Trigger.Icon
                    sf={{ default: "square.stack.3d.down.right", selected: "square.stack.3d.down.right.fill" }}
                />
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="earning">
                <NativeTabs.Trigger.Label>Гаманець</NativeTabs.Trigger.Label>
                <NativeTabs.Trigger.Icon
                    sf={{ default: "wallet.bifold", selected: "wallet.bifold.fill" }}
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