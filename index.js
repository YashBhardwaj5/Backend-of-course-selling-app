const express=require('express');
const app=express();
app.post("/user/signup",function(req,res){
    res.json({
        message:"signed up"
    })
})
app.post("/user/signin",function(req,res){ 
    res.json({
        message:"signed up"
    })
})
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
app.listen(3000);