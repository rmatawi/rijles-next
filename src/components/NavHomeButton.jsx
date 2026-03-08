import { Button } from "framework7-react";
import useAppNavigation from "../hooks/useAppNavigation";

const baseStyle = {
  width: "36px",
  height: "36px",
  minWidth: "36px",
};

const NavHomeButton = ({ href = "/", style, className = "neu-btn-circle" }) => {
  const { navigate } = useAppNavigation();

  return (
    <Button
      iconF7="house"
      onClick={() => navigate(href)}
      className={className}
      style={{ ...baseStyle, ...style }}
    />
  );
};

export default NavHomeButton;
