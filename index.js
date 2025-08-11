import express from 'express';
import {Client} from 'pg';
import dotenv from "dotenv";
import jwt  from 'jsonwebtoken';
import bcrypt from "bcrypt";
dotenv.config();
const app=express();
app.use(express.json());
const pgClient = new Client({connectionString:process.env.BACKEND_URI})
app.post("/user/signup",async function(req,res){
    const { full_name, password, email } = req.body;
    const password_hash=await bcrypt.hash(password,10);
    try{await pgClient.query(
          `INSERT INTO Users (full_name, password_hash, email) VALUES ($1, $2, $3)`,[full_name, password_hash, email]);
            res.json({
            message:"signed up"
        })}
    catch(e){
        console.error("Failed to sign in error:",e);
    }
})
app.post("/user/signin", async function (req, res) {
    try {
        const { email, password } = await req.body;
        const data = await pgClient.query("SELECT * FROM Users WHERE email = $1", [email]);
        if (data.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        const user = data.rows[0];
        console.log(user);
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: "Wrong credentials" });
        }
        const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET);
        res.json({
            message: "Signed in successfully",
            token: token
        });
    } catch (error) {
        console.error("Sign-in error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
app.get("/user/purchases",function(req,res){
    res.json({
        message:"my purchases end point"
    })
})
app.get("/courses",function(req,res){
    res.json({
        message:"available courses end point"
    })
})
app.post("/course/purchase",function(req,res){
    res.json({
        message:"make a purchase end point"
    })
})
const startServer = async () => {
    try {
        await pgClient.connect();
        console.log("DB connected");
        app.listen(3000, () => {
            console.log("server running on http://localhost:3000");
        });
    } catch (err) {
        console.error("Failed to connect to DB:", err);
        process.exit(1); // stop the app
    }
};
startServer();
