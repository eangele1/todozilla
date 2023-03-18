import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  Image,
  Animated,
  Pressable,
  Keyboard,
  Platform,
} from "react-native";
import {
  getDatabase,
  ref,
  push,
  set,
  onValue,
  get,
  child,
} from "firebase/database";
import { useAuth } from "../context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBarHeight } from "../utils/StatusBarHeight";
import { Feather, FontAwesome } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import Task from "./Task.js";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

const Home = (props) => {
  const { auth, userID } = useAuth();
  const insets = useSafeAreaInsets();

  const db = getDatabase();
  const dbRef = ref(db);
  const userNameRef = ref(db, "scores/" + userID);
  const taskListRef = ref(db, "tasks/" + userID);
  const newTaskRef = push(taskListRef);

  const [topThree, setTopThree] = useState([]);
  const currentScore = useRef(0);

  const [UserName, setUserName] = useState("");

  // bounceValue will be used as the value for translateY. Initial Value: height of device
  const bounceValue = useRef(new Animated.Value(-height)).current;
  const isHidden = useRef(true);

  // holds value for when keyboard is open/closed
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  const [tasks, setTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);

  const mainRenderItem = ({ item }) => (
    <Task
      item={item}
      db={db}
      userID={userID}
      currentScore={currentScore}
      tasks={tasks}
      setTasks={setTasks}
      completedTasks={completedTasks}
      setCompletedTasks={setCompletedTasks}
    />
  );

  const keyExtractor = useCallback((item) => item.id.toString(), []);

  const toggleSubview = () => {
    isHidden.current &&
      get(child(dbRef, "scores/"))
        .then((snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();

            let arr = Object.keys(data)
              .map((key) => data[key])
              .sort((a, b) => b.currentScore - a.currentScore);

            setTopThree(arr.splice(0, 3));
          } else {
            setTopThree([]);
          }
        })
        .catch((error) => {
          console.error(error);
        });

    Animated.spring(bounceValue, {
      toValue: isHidden.current ? 0 : -height,
      speed: 20,
      useNativeDriver: true,
    }).start();

    isHidden.current = !isHidden.current;
  };

  //retrieves tasks from database and updates if any changes are made
  useEffect(() => {
    return onValue(
      taskListRef,
      (snapshot) => {
        if (snapshot.val() !== null) {
          const data = snapshot.val();
          let result = Object.keys(data).map((key) => data[key]);

          let notFinishedTasks = [];
          let finishedTasks = [];

          result.map((item) => {
            if (item.complete) {
              finishedTasks.push(item);
            } else {
              notFinishedTasks.push(item);
            }
          });

          setTasks(notFinishedTasks);
          setCompletedTasks(finishedTasks);
        } else {
          setTasks([]);
          setCompletedTasks([]);
        }
      },
      { onlyOnce: true }
    );
  }, []);

  //sets the user's current score
  useEffect(() => {
    return onValue(
      userNameRef,
      (snapshot) => {
        if (snapshot.val() !== null) {
          const data = snapshot.val();
          setUserName(data.name);
          currentScore.current = data.currentScore;
        } else {
          setUserName("User");
        }
      },
      { onlyOnce: true }
    );
  }, []);

  //checks on userID and executes when it changes
  useEffect(() => {
    if (userID === "") {
      props.navigation.reset({
        index: 0,
        routes: [{ name: "Auth" }],
      });
    }
  }, [userID]);

  //checks to see if keyboard is open/closed; mainly for task visibility
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  //adds task to database
  const onSubmit = () => {
    set(newTaskRef, {
      id: newTaskRef.key,
      name: "",
      complete: false,
      pointGiven: false,
    });

    setTasks([
      ...tasks,
      {
        id: newTaskRef.key,
        name: "",
        complete: false,
        pointGiven: false,
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[
          "rgba(47, 86, 248, 0.8)",
          "rgba(199, 47, 248, 0.25)",
          "#E4E7EB",
        ]}
        locations={[0.15, 0.75, 1]}
        style={{
          width: width,
          height: 85,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View style={{ width: width, height: StatusBarHeight }} />
        <Text style={{ fontFamily: "Poppins-Regular", fontSize: 24 }}>
          {UserName !== "" ? `Welcome Back, ${UserName}!` : ""}
        </Text>
      </LinearGradient>
      <View
        style={{
          position: "absolute",
          top: 75,
          width: width,
          flexDirection: "row",
          justifyContent: "center",
        }}
      >
        <TouchableOpacity onPress={toggleSubview}>
          <FontAwesome name="caret-down" size={30} color="black" />
        </TouchableOpacity>
      </View>

      {tasks.length !== 0 || completedTasks.length !== 0 ? (
        <View
          style={{
            width: width,
            height:
              insets.bottom !== 0
                ? height * 0.7 - insets.bottom - 20
                : height * 0.7,
          }}
        >
          {tasks.length !== 0 ? (
            <>
              <Text
                style={{
                  fontFamily: "Poppins-Regular",
                  fontSize: 36,
                  marginLeft: 10,
                }}
              >
                To-Do
              </Text>
              <View
                style={{
                  width: width,
                  height:
                    completedTasks.length !== 0 || isKeyboardVisible
                      ? height * 0.25
                      : height * 0.66,
                  alignItems: "center",
                }}
              >
                <FlatList
                  data={tasks}
                  removeClippedSubviews={false}
                  renderItem={mainRenderItem}
                  keyExtractor={keyExtractor}
                />
              </View>
            </>
          ) : (
            <></>
          )}
          {completedTasks.length !== 0 ? (
            <>
              <Text
                style={{
                  fontFamily: "Poppins-Regular",
                  fontSize: 36,
                  marginLeft: 10,
                }}
              >
                Completed
              </Text>
              <View
                style={{
                  width: width,
                  height: tasks.length !== 0 ? height * 0.25 : height * 0.66,
                  alignItems: "center",
                }}
              >
                <FlatList
                  data={completedTasks}
                  renderItem={mainRenderItem}
                  keyExtractor={keyExtractor}
                />
              </View>
            </>
          ) : (
            <></>
          )}
        </View>
      ) : (
        <View>
          <Image
            style={{ width: "100%", height: 50, marginBottom: 20 }}
            resizeMode={"contain"}
            source={require("../assets/loading_logo.png")}
          />
          <Text style={styles.introText}>
            Press the button below to get started!
          </Text>
          <Feather
            name="corner-right-down"
            style={{ textAlign: "center" }}
            size={80}
            color="black"
          />
        </View>
      )}

      <LinearGradient
        colors={[
          "#E4E7EB",
          "rgba(199, 47, 248, 0.25)",
          "rgba(47, 86, 248, 0.8)",
        ]}
        locations={[0.1, 0.5, 1]}
        style={{
          width: width,
          height: insets.bottom + 85,
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity
          style={styles.button}
          onPress={() => props.navigation.navigate("Score")}
        >
          <Image
            source={require("../assets/buttons/leaderboard-button.png")}
            resizeMode="contain"
            style={{
              width: 60,
              height: 60,
              marginTop: insets.bottom + 20,
              marginLeft: 20,
            }}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => onSubmit()}>
          <Image
            source={require("../assets/buttons/add-button.png")}
            resizeMode="contain"
            style={{ width: 80, height: 80 }}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => auth.signOut()}>
          <Image
            source={require("../assets/buttons/sign-out-button.png")}
            resizeMode="contain"
            style={{
              width: 60,
              height: 60,
              marginTop: insets.bottom + 20,
              marginRight: 20,
            }}
          />
        </TouchableOpacity>
      </LinearGradient>
      <Animated.View
        style={[styles.subView, { transform: [{ translateY: bounceValue }] }]}
      >
        <Pressable
          onPress={toggleSubview}
          style={{ flex: 1, backgroundColor: "transparent" }}
        />
        <BlurView
          intensity={75}
          tint="light"
          style={{
            width: width,
          }}
        >
          <Text
            style={{
              textAlign: "center",
              fontFamily: "Poppins-Regular",
              fontSize: 24,
            }}
          >
            Top Doers
          </Text>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-around",
              alignItems: "center",
            }}
          >
            <View style={{ alignItems: "center" }}>
              <Image
                resizeMode="contain"
                style={{ width: 85, height: 85 }}
                source={require("../assets/2nd-icon.png")}
              />

              <Text style={{ fontFamily: "Poppins-Regular" }}>
                {topThree[1] !== undefined ? topThree[1].name : ""}
              </Text>
              <Text style={{ fontFamily: "Poppins-Regular" }}>
                {topThree[1] !== undefined ? topThree[1].currentScore : ""}
              </Text>
            </View>

            <View style={{ alignItems: "center" }}>
              <Image
                resizeMode="contain"
                style={{ width: 115, height: 115 }}
                source={require("../assets/1st-icon.png")}
              />

              <Text style={{ fontFamily: "Poppins-Regular" }}>
                {topThree[0] !== undefined ? topThree[0].name : ""}
              </Text>
              <Text style={{ fontFamily: "Poppins-Regular" }}>
                {topThree[0] !== undefined ? topThree[0].currentScore : ""}
              </Text>
            </View>

            <View style={{ alignItems: "center" }}>
              <Image
                resizeMode="contain"
                style={{ width: 85, height: 85 }}
                source={require("../assets/3rd-icon.png")}
              />

              <Text style={{ fontFamily: "Poppins-Regular" }}>
                {topThree[2] !== undefined ? topThree[2].name : ""}
              </Text>
              <Text style={{ fontFamily: "Poppins-Regular" }}>
                {topThree[2] !== undefined ? topThree[2].currentScore : ""}
              </Text>
            </View>
          </View>
        </BlurView>
        <Pressable
          onPress={toggleSubview}
          style={{ flex: 5, backgroundColor: "transparent" }}
        />
      </Animated.View>
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    backgroundColor: "#E4E7EB",
    justifyContent: "space-between",
  },
  introText: {
    textAlign: "center",
    fontFamily: "Poppins-Regular",
    fontSize: 30,
  },
  button: {
    elevation: 15,
    shadowColor: "#000",
  },
  subView: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "transparent",
    height:
      StatusBarHeight > 24 && Platform.OS === "android"
        ? height + StatusBarHeight
        : height,
  },
});
