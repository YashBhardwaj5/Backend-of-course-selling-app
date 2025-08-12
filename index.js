import express from 'express';
import {Client} from 'pg';
import dotenv from "dotenv";
import jwt  from 'jsonwebtoken';
import bcrypt from "bcrypt";
import { UserAuth,InstructorAuth } from './middleware.js';
dotenv.config();
const app=express();
app.use(express.json());
const pgClient = new Client({connectionString:process.env.BACKEND_URI})
app.post("/user/signup",async function(req,res){
    const { full_name, password, email,role } = req.body;
    const password_hash=await bcrypt.hash(password,10);
    try{await pgClient.query(
          `INSERT INTO Users (full_name, password_hash, email,role) VALUES ($1, $2, $3,$4)`,[full_name, password_hash, email,role]);
            res.status(201).json({
            message:"signed up"
        })}
    catch(e){
        console.error("Failed to sign up error:",e);
        res.status(500).json({ message: "Signup failed" });
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
        const token = jwt.sign({ user_id: user.user_id,
        email: user.email,
        role: user.role,
        full_name: user.full_name}, process.env.JWT_SECRET,{ expiresIn: "2d" });
        res.json({
            message: "Signed in successfully",
            token: token
        });
        } catch (error) {
        console.error("Sign-in error:", error);
        res.status(500).json({ message: "Internal server error" });
        }
});
app.get("/user/purchases",UserAuth,function(req,res){
    res.json({
        message:"my purchases end point"
    })
})
app.get("/courses",UserAuth,async function(req,res){
    try{const data=await pgClient.query("SELECT * FROM courses ORDER BY created_at DESC");
    const courselist=data.rows;
    res.json({
        message:"available courses end point",
        courses:courselist
    })
    }
    catch(e){
        console.error("error occured while fetching courses :",e);
        res.status(500).json({
            message: "Failed to fetch courses",
            error: e.message
        });
    }
})
app.get("/courses/:id",UserAuth,async function(req,res){
    try{const data=await pgClient.query("SELECT * FROM courses where course_id=$1",[req.params.id]);
    const courselist=data.rows;
    res.json({
        message:"available courses end point",
        courses:courselist
    })
    }
    catch(e){
        console.error("error occured while fetching courses :",e);
        res.status(500).json({
            message: "Failed to fetch courses",
            error: e.message
        });
    }
})
app.post("/courses",InstructorAuth,async function(req,res){
    try{
    const {title,price}=req.body;
    await pgClient.query("INSERT INTO courses (title, price, instructor_id) VALUES ($1, $2, $3)",[title, price, req.user_id]);
    res.json({
        message:"course added"
    })}catch(e){
        console.error("Error occured while adding course :",e);
        res.status(500).json({ error: "Internal server error" });
    }
})
app.post("/course/purchase",UserAuth,function(req,res){
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
