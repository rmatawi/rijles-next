import { Button } from "framework7-react";

const baseStyle = {
  width: "36px",
  height: "36px",
  minWidth: "36px",
};

const NavHomeButton = ({ href = "/", style, className = "neu-btn-circle" }) => (
  <Button
    iconF7="house"
    href={href}
    className={className}
    style={{ ...baseStyle, ...style }}
  />
);

export default NavHomeButton;
