import avatar_icon from "./avatar_icon.png";
import gallery_icon from "./gallery_icon.svg";
import help_icon from "./help_icon.png";
import logo_icon from "./logo_icon.svg";
import logo_big from "./logo_big.svg";
import logo from "./logo.png";
import profile_richard from "./profile_richard.png";
import profile_alison from "./profile_alison.png";
import profile_enrique from "./profile_enrique.png";
import profile_marco from "./profile_marco.png";
import profile_martin from "./profile_martin.png";
import search_icon from "./search_icon.png";
import send_button from "./send_button.svg";
import menu_icon from "./menu_icon.png";
import arrow_icon from "./arrow_icon.png";

interface Assets {
  avatar_icon: string;
  gallery_icon: string;
  help_icon: string;
  logo_big: string;
  logo_icon: string;
  logo: string;
  search_icon: string;
  send_button: string;
  menu_icon: string;
  arrow_icon: string;
}

const assets: Assets = {
  avatar_icon,
  gallery_icon,
  help_icon,
  logo_big,
  logo_icon,
  logo,
  search_icon,
  send_button,
  menu_icon,
  arrow_icon,
};

export default assets;

interface User {
  _id: string;
  email: string;
  fullname: string;
  profilePic: string;
  bio: string;
}

export const userDummyData: User[] = [
  {
    _id: "680f50aaf10f3cd28382ecf2",
    email: "test1@greatstack.dev",
    fullname: "Alison Martin",
    profilePic: profile_alison,
    bio: "Hi Everyone, I am Using QuickChat",
  },
  {
    _id: "680f50e4f10f3cd28382ecf9",
    email: "test2@greatstack.dev",
    fullname: "Martin Johnson",
    profilePic: profile_martin,
    bio: "Hi Everyone, I am Using QuickChat",
  },
  {
    _id: "680f510af10f3cd28382ed01",
    email: "test3@greatstack.dev",
    fullname: "Enrique Martinez",
    profilePic: profile_enrique,
    bio: "Hi Everyone, I am Using QuickChat",
  },
  {
    _id: "680f5137f10f3cd28382ed10",
    email: "test4@greatstack.dev",
    fullname: "Marco Jones",
    profilePic: profile_marco,
    bio: "Hi Everyone, I am Using QuickChat",
  },
  {
    _id: "680f516cf10f3cd28382ed11",
    email: "test5@greatstack.dev",
    fullname: "Richard Smith",
    profilePic: profile_richard,
    bio: "Hi Everyone, I am Using QuickChat",
  },
];
