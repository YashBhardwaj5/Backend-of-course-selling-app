import jwt from "jsonwebtoken";
export const UserAuth=(req,res,next)=>{
    try{
    const token=req.headers["authorization"];
    if(!token){
        return res.status(401).json({ message: "token is missing" });
    }
    const decodedToken=jwt.verify(token,process.env.JWT_SECRET);
    req.email=decodedToken.email;
    req.role=decodedToken.role;
    req.user_id=decodedToken.user_id;
    next();
    }
    catch(e){
        console.error("invalid token",e);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}
export const InstructorAuth=(req,res,next)=>{
    UserAuth(req, res, () => {
        if (req.role === "instructor") {
            return next();
        }
        return res.status(403).json({ message: "Access denied: not an instructor" });
    });
}