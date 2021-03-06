const bcrypt = require("bcryptjs");

module.exports = {
  getUser: (req, res) => {
    //# won't get to this point if no user is logged in (because of middleware)
    res.status(200).send(req.session.user);
  },
  editUser: async (req, res) => {
    //# won't get to this point if no user is logged in (because of middleware)
    const db = req.app.get("db");
    const { img } = req.body;
    const { user_id } = req.session.user;

    const [updatedUser] = await db.auth.edit_user([user_id, img]);

    req.session.user = updatedUser;
    res.status(200).send(req.session.user);
  },
  login: async (req, res) => {
    //# see if a user exists (we want it to)
    //# check the password
    //# log user in (on session) and send user to front end
    const db = req.app.get("db");
    const { email, password } = req.body;
    try {
      const [foundUser] = await db.auth.find_email(email);

      if (foundUser) {
        const comparePassword = foundUser.password;
        const authenticated = bcrypt.compareSync(password, comparePassword);
        if (authenticated) {
          delete foundUser.password;
          req.session.user = foundUser;
          res.status(200).send(req.session.user);
        } else {
          res.status(401).send("Email or passgourd incorrect");
        }
      } else {
        res.status(401).send("Email or passgourd incorrect");
      }
    } catch (err) {
      console.log("Database error on login function", err);
    }
  },
  register: async (req, res) => {
    //# see if user exists (we don't want it to)
    //# store user on db (with password)
    //# log user in (on session) and send user to front end
    const db = req.app.get("db");
    const { email, password } = req.body;

    try {
      const [foundUser] = await db.auth.find_email(email);
      if (foundUser) {
        res.status(401).send("User already exists");
      } else {
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(password, salt);
        const [newUser] = await db.auth.register_user([email, hash]);

        req.session.user = newUser;
        res.status(200).send(req.session.user);
      }
    } catch (err) {
      "Database error on register function", err;
    }
  },
  logout: (req, res) => {
    req.session.destroy();
    res.sendStatus(200);
  },
};

//# axios.put('/api/user/shrek.jpg')
//# axios.put('/api/user?img=shrek.jpg')
//# axios.put('/api/user', {img: 'shrek.jpg'})
