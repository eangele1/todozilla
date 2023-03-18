import React, { useEffect, useRef, useCallback } from "react";
import {
  View,
  TextInput,
  Pressable,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { ref, update, remove } from "firebase/database";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { FontAwesome, FontAwesome5 } from "@expo/vector-icons";

const Task = (props) => {
  const inputRef = useRef();
  const textRef = useRef("");
  const editText = useCallback(() => {
    inputRef.current.setNativeProps({ text: props.item.name });
  }, []);

  useEffect(() => editText(), []);

  const userScoreRef = ref(props.db, "scores/" + props.userID);
  const taskRef = ref(props.db, "tasks/" + props.userID + "/" + props.item.id);
  const { width } = Dimensions.get("window");
  const closeTask = useRef(null);

  //updates task name
  const editTask = (name) => {
    if (name === "") {
      return;
    }

    update(taskRef, {
      name: name,
    });

    let arr = [...props.tasks];
    let index = arr.indexOf(props.item);
    arr[index] = { ...arr[index], name: name };

    props.setTasks(arr);
  };

  //handles points given when a task is marked true or false for completion
  const handleComplete = () => {
    if (props.item.name === "") {
      return;
    }

    let completedArr = [...props.completedTasks];
    let taskArr = [...props.tasks];

    if (props.item.complete) {
      let index = completedArr.indexOf(props.item);
      let newItem = {
        ...completedArr[index],
        complete: false,
      };
      completedArr.splice(index, 1);
      taskArr.push(newItem);

      props.setCompletedTasks(completedArr);
      props.setTasks(taskArr);
    } else {
      let index = taskArr.indexOf(props.item);
      let newItem = {
        ...taskArr[index],
        pointGiven: true,
        complete: true,
      };
      taskArr.splice(index, 1);
      completedArr.push(newItem);

      props.setCompletedTasks(completedArr);
      props.setTasks(taskArr);
    }

    if (!props.item.pointGiven) {
      update(userScoreRef, { currentScore: props.currentScore.current + 1 });
      props.currentScore.current = props.currentScore.current + 1;
    }

    update(taskRef, {
      pointGiven: true,
      complete: !props.item.complete,
    });
  };

  //deletes a task
  const deleteTask = () => {
    if (props.item.complete) {
      let arr = [...props.completedTasks];
      arr.splice(arr.indexOf(props.item), 1);
      props.setCompletedTasks(arr);
    } else {
      let arr = [...props.tasks];
      arr.splice(arr.indexOf(props.item), 1);
      props.setTasks(arr);
    }

    remove(taskRef);
  };

  //renders the delete button when user swipes to the left
  const RenderRight = () => {
    return (
      <Pressable
        onPress={deleteTask}
        style={{
          backgroundColor: "red",
          justifyContent: "center",
          alignItems: "center",
          marginTop: 7.5,
          marginRight: 10,
          height: 40,
          width: 40,
          borderRadius: 10,
        }}
      >
        <FontAwesome5 name="trash" size={24} color="white" />
      </Pressable>
    );
  };

  return (
    <Swipeable
      ref={closeTask}
      useNativeAnimations
      overshootLeft={false}
      overshootRight={false}
      renderRightActions={RenderRight}
    >
      <View
        style={{
          backgroundColor: "white",
          flexDirection: "row",
          justifyContent: "space-between",
          width: width * 0.9,
          padding: 10,
          borderRadius: 10,
          marginHorizontal: 10,
          marginVertical: 7.5,
          elevation: 5,
          height: 40,
          alignItems: "center",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity onPress={handleComplete}>
            {props.item.complete ? (
              <View
                style={{
                  borderRadius: 50,
                  width: 20,
                  height: 20,
                  backgroundColor: "#4BD37B",
                  borderColor: "black",
                  borderWidth: 1,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <FontAwesome name="check" size={15} color="white" />
              </View>
            ) : (
              <View
                style={{
                  borderRadius: 50,
                  width: 20,
                  height: 20,
                  backgroundColor: "white",
                  borderColor: "black",
                  borderWidth: 1,
                }}
              ></View>
            )}
          </TouchableOpacity>

          <View style={{ marginLeft: 10 }}>
            <TextInput
              style={{
                textDecorationLine: props.item.complete
                  ? "line-through"
                  : "none",
                color: props.item.complete ? "gray" : "black",
                fontFamily: "Karla-Regular",
                fontSize: 18,
                width: width * 0.65,
              }}
              editable={props.item.complete ? false : true}
              ref={inputRef}
              onChangeText={(e) => (textRef.current = e)}
              autoFocus={props.item.name === "" ? true : false}
              onBlur={() => editTask(textRef.current)}
              autoCapitalize="none"
            ></TextInput>
          </View>

          <FontAwesome5
            style={{ marginLeft: 20 }}
            name="grip-lines-vertical"
            size={24}
            color="#999999"
          />
        </View>
      </View>
    </Swipeable>
  );
};

export default React.memo(Task);
