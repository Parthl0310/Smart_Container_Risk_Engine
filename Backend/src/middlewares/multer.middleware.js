import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/temp");
  },

  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {

  const ext = path.extname(file.originalname);

  if (ext !== ".csv") {
    return cb(new Error("Only CSV files allowed"), false);
  }

  cb(null, true);

};

export const upload = multer({
  storage,
  fileFilter,
});