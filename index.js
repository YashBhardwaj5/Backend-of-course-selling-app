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
//sign in and sign up
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
//courses crud
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
app.put("/courses/:id",InstructorAuth,async function(req,res){
    try{
        const courseCheck = await pgClient.query("SELECT * FROM courses WHERE course_id = $1 AND instructor_id = $2",[req.params.id, req.user_id]);
        if (courseCheck.rowCount === 0) {
            return res.status(403).json({ message: "Not authorized for this course" });
        }
        await pgClient.query("UPDATE courses SET title = COALESCE($1, title),price = COALESCE($2, price),description = COALESCE($3, description),thumbnail_url = COALESCE($4,thumbnail_url) WHERE course_id = $5 AND instructor_id = $6",[req.body.title||null,req.body.price|| null,req.body.description||null,req.body.thumbnail_url||null,req.params.id,req.user_id]);
        res.json({
        message:"Course updated successfully"
    })
    }
    catch(e){
        console.error("Error occurred while updating courses:", e);
            res.status(500).json({
            message: "Failed to update courses",
            error: e.message
        });
    }
})

app.delete("/courses/:id",InstructorAuth,async function(req,res){
    try{
        const courseCheck = await pgClient.query("SELECT * FROM courses WHERE course_id = $1 AND instructor_id = $2",[req.params.id, req.user_id]);
        if (courseCheck.rowCount === 0) {
            return res.status(403).json({ message: "Not authorized for this course" });
        }
        await pgClient.query("DELETE FROM courses where course_id=$1",[req.params.id]);
        res.json({
            message:"Course deleted"
        })}catch(e){
            console.error("Error occured while deleting a course :",e);
            res.status(500).json({ error: "Internal server error" });
        }
})
//courses->lessons crud
app.get("/courses/:courseId/lessons",UserAuth,async function(req,res){
    try{
    const data=await pgClient.query("SELECT * FROM lessons WHERE course_id=$1 ORDER BY position",[req.params.courseId]); 
    const lessons=data.rows;
    res.json({
        message:"Lessons fetched successfully",
        lessons:lessons
    })
    }catch(e){
        console.error("Error occurred while fetching lessons",e);
        res.status(500).json({
            message:"Error occurred while fetching lessons",
            error:e.message
        })
    }
})
app.get("/lessons/:lessonid",UserAuth,async function(req,res){
    try{
    const data=await pgClient.query("SELECT * FROM lessons WHERE lesson_id=$1",[req.params.lessonid]); 
    
    if (data.rowCount === 0) {
    return res.status(404).json({ message: "Lesson not found" });
    }
    const lesson=data.rows[0];
    res.json({
        message:"Lessons fetched successfully",
        lesson:lesson
    })
    }catch(e){
        console.error("Error occurred while fetching lessons",e);
        res.status(500).json({
            message:"Error occurred while fetching lessons",
            error:e.message
        })
    }
})
app.post("/courses/:courseId/lessons",InstructorAuth,async function(req,res){
    
    try{
        const {title,video_url,content,position}=req.body;
        const courseCheck = await pgClient.query("SELECT * FROM courses WHERE course_id = $1 AND instructor_id = $2",[req.params.courseId, req.user_id]);
        if (courseCheck.rowCount === 0) {
            return res.status(403).json({ message: "Not authorized for this course" });
        }
        await pgClient.query("INSERT INTO lessons (course_id,title,video_url,content,position) VALUES ($1,$2,$3,$4,$5)",[req.params.courseId,title,video_url,content,position]);
        res.status(201).json({
            message:"Lesson added successfully"
        })}
        catch(e){
            res.status(500).json({
            message:"Error occurred while adding lessons",
            error:e.message
        })
    }
})

app.put("/lessons/:lessonid",InstructorAuth,async function(req,res){
    try{
        const { title, content, video_url, position } = req.body;
        const check = await pgClient.query(
            `SELECT lessons.lesson_id
             FROM lessons
             JOIN courses ON lessons.course_id = courses.course_id
             WHERE lessons.lesson_id = $1 AND courses.instructor_id = $2`,
            [req.params.lessonid, req.user_id]
        );
        if (check.rowCount === 0) {
            return res.status(403).json({ message: "Not authorized to update this lesson" });
        }
        await pgClient.query(
                `UPDATE lessons 
                SET title = COALESCE($1, title),
                content = COALESCE($2, content),
                video_url = COALESCE($3, video_url),
                position= COALESCE($4, position)
                WHERE lesson_id = $5`,
                [title || null, content || null, video_url || null,position||null, req.params.lessonid]
        );
        res.json({
        message:"Lesson updated successfully"
        })
    }
    catch(e){
        console.error("Error occurred while updating lesson :",e);
        res.status(500).json({ message: "Error occurred while updating lesson" });
    }
})
app.delete("/lessons/:lessonid",InstructorAuth,async function(req,res){
    try{
        const check = await pgClient.query(
            `SELECT lessons.lesson_id
             FROM lessons
             JOIN courses ON lessons.course_id = courses.course_id
             WHERE lessons.lesson_id = $1 AND courses.instructor_id = $2`,
            [req.params.lessonid, req.user_id]
        );
        if (check.rowCount === 0) {
            return res.status(403).json({ message: "Not authorized to delete this lesson" });
        }
        await pgClient.query(`DELETE FROM lessons WHERE lesson_id=$1`,[req.params.lessonid]);
        res.json({
            message:"Lesson deleted successfully"
        })}
    catch(e){
        console.error("Error occurred while deleting lesson :",e);
        res.status(500).json({ message: "Error occurred while deleting lesson" });
    }
})
//purchases crud
app.get("/user/purchases",UserAuth,function(req,res){
    res.json({
        message:"my purchases end point"
    })
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
        process.exit(1); 
    }
};
startServer();
