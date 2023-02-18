const express = require("express");
const app = express();
const port = 8080;

// Parse JSON bodies (as sent by API clients)
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
const { connection } = require("./connector");

app.get("/", (req, res) => {
  res.send("Hello");
});

app.get("/totalRecovered", async (req, res) => {
  const data = await connection.aggregate([
    { $group: { _id: "Total", recovered: { $sum: "$recovered" } } },
  ]);
  res.json({ data: data });
});

app.get("/totalActive", async (req, res) => {
  const data = await connection.aggregate([
    {
      $group: {
        _id: "Total",
        active: { $sum: { $subtract: ["$infected", "$recovered"] } },
      },
    },
  ]);
  res.json({ data: data });
});

app.get("/totalDeath", async (req, res) => {
  const data = await connection.aggregate([
    { $group: { _id: "Total", death: { $sum: "$death" } } },
  ]);
  res.json({ data: data });
});

app.get("/hotspotStates", async (req, res) => {
  const data = await connection.find(
    {
      $expr: {
        $gt: [
          {
            $round: [
              {
                $divide: [
                  { $subtract: ["$infected", "$recovered"] },
                  "$infected",
                ],
              },
              5,
            ],
          },
          0.1,
        ],
      },
    },
    {
      state: 1,
      _id: 0,
      rate: {
        $round: [
          {
            $divide: [{ $subtract: ["$infected", "$recovered"] }, "$infected"],
          },
          5,
        ],
      },
    }
  );
  res.json({ data: data });
});

app.get("/healthyStates", async (req, res) => {
  const data = await connection.find(
    {
      $expr: {
        $lt: [
          {
            $round: [
              {
                $divide: ["$death", "$infected"],
              },
              5,
            ],
          },
          0.005,
        ],
      },
    },
    {
      state: 1,
      _id: 0,
      mortality: {
        $round: [
          {
            $divide: ["$death", "$infected"],
          },
          5,
        ],
      },
    }
  );
  res.json({ data: data });
});

app.listen(port, () => console.log(`App listening on port ${port}!`));

module.exports = app;
