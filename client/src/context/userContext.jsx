import { createContext, useReducer } from "react";

export const UserContext = createContext();

const initialState = {
  isLogin: false,
  user: {},
};

const userReducer = (state, action) => {
  const { type, payload } = action;

  switch (type) {
    case "USER_SUCCESS":
    case "LOGIN_SUCCESS":
      localStorage.setItem("token", payload.token);
      return {
        isLogin: true,
        user: {
          ...payload,
          isAdmin: payload.isAdmin,
        },
      };

    case "AUTH_ERROR":
    case "LOGOUT":
      localStorage.removeItem("token");
      return {
        isLogin: false,
        user: {},
      };

    default:
      return state;
  }
};

export const UserContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(userReducer, initialState);

  return (
    <UserContext.Provider value={[state, dispatch]}>
      {children}
    </UserContext.Provider>
  );
};
