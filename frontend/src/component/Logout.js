import { useContext, useEffect } from "react";
import { Redirect } from "react-router-dom";

import { SetPopupContext } from "../App";

const Logout = (props) => {
  const setPopup = useContext(SetPopupContext);
  useEffect(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("type");
    setPopup({
      open: true,
      severity: "success",
      message: "Logged out successfully",
    });
  }, [setPopup]);
  return <Redirect to="/login" />;
};

export default Logout;
