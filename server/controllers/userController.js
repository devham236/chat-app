const UserModel = require("../models/UserModel");
const ImageModel = require("../models/imageModel");
const genToken = require("../utils/genToken");
const jwt = require("jsonwebtoken");

const getUser = async (req, res) => {
  const input = req.query.search;
  try {
    const users = await UserModel.getUsers(input);
    res.status(200).json({ users });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const getUserList = async (req, res) => {
  const list = await UserModel.find({});
  res.status(200).json({ usersList: list });
};

const signUp = async (req, res) => {
  const { username, email, password, image } = req.body;
  try {
    const newUser = await UserModel.signup(username, email, password, image);
    const token = genToken(newUser._id);
    res.status(200).json({
      username: newUser.username,
      email: newUser.email,
      id: newUser._id,
      token,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await UserModel.login(email, password);
    const token = genToken(user._id);
    res.status(200).json({
      username: user.username,
      email: user.email,
      id: user._id,
      token,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const verifyUser = async (req, res) => {
  const { token } = req.body;

  if (token) {
    jwt.verify(token, process.env.JWT_KEY, async (err, data) => {
      if (err) throw err;
      const matchingUser = await UserModel.findOne({ _id: data.id });
      res.status(200).json({
        username: matchingUser.username,
        email: matchingUser.email,
        id: matchingUser._id,
      });
    });
  } else {
    res.status(400).json({ message: "No token provided" });
  }
};

module.exports = { getUser, getUserList, signUp, login, verifyUser };
