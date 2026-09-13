import {deleteSecureStore, getSecureStore} from "@/utils/secureStore";
import {Text} from "react-native"
import {Button} from "@/components/ui/button";
import {router} from "expo-router";

export default function Test() {
    return (
        <>
            <Text>{getSecureStore("accessToken")}</Text>
            <Text>{getSecureStore("refreshToken")}</Text>

            <Button variant={"destructive"} onPress={() => {
                deleteSecureStore("accessToken");
                deleteSecureStore("refreshToken");
                router.replace("/(auth)/login");
            }}>
                <Text>LogOut</Text>
            </Button>
        </>
    )
}