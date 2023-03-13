import express, { Router } from "express";
const dbRoute = Router();

dbRoute.get("/", (request: express.Request, response: express.Response) => {
  response.send("Reached");
});



export default dbRoute;
