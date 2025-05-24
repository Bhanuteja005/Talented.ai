import { Button, Grid, LinearProgress, TextField } from "@material-ui/core";
import { CloudUpload } from "@material-ui/icons";
import Axios from "axios";
import { useContext, useEffect, useState } from "react";

import { SetPopupContext } from "../App";

const FileUploadInput = (props) => {
  const setPopup = useContext(SetPopupContext);
  
  const { uploadTo, identifier, handleInput, initialValue } = props;
  
  const [file, setFile] = useState("");
  const [uploadPercentage, setUploadPercentage] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [displayValue, setDisplayValue] = useState("");

  // Load initial value when component mounts or initialValue changes
  useEffect(() => {
    if (initialValue) {
      setDisplayValue(initialValue);
      console.log("FileUploadInput: Initial value loaded:", initialValue);
    }
  }, [initialValue]);

  const handleUpload = async () => {
    console.log("=== FRONTEND UPLOAD START ===");
    console.log("File:", file);
    console.log("Upload URL:", uploadTo);
    
    if (file === "") {
      setPopup({
        open: true,
        severity: "error",
        message: "Please select a file",
      });
      return;
    }

    const formData = new FormData();
    formData.append(identifier, file);
    
    console.log("FormData:", identifier, file);

    setIsUploading(true);
    setUploadPercentage(0);
    
    try {
      const response = await Axios.post(uploadTo, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadPercentage(progress);
          console.log("Upload progress:", progress + "%");
        },
      });

      console.log("Upload response:", response.data);
      
      // Handle different response formats
      if (response.data.success) {
        const filename = response.data.filename || response.data.fileId;
        setDisplayValue(filename);
        setFile(""); // Clear the file input after successful upload
        
        setPopup({
          open: true,
          severity: "success",
          message: response.data.message || "File uploaded successfully",
        });
        
        // Notify parent component
        if (handleInput) {
          handleInput(identifier, filename);
        }
      } else {
        // Fallback for older response format
        const filename = response.data.filename || file.name;
        setDisplayValue(filename);
        setFile(""); // Clear the file input after successful upload
        
        setPopup({
          open: true,
          severity: "success",
          message: response.data.message || "File uploaded successfully",
        });
        
        // Notify parent component
        if (handleInput) {
          handleInput(identifier, filename);
        }
      }

    } catch (err) {
      console.error("Upload failed:", err);
      console.log("Response status:", err.response?.status);
      console.log("Response data:", err.response?.data);
      console.log("Response headers:", err.response?.headers);
      
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          err.message || 
                          "Upload failed";
      
      setPopup({
        open: true,
        severity: "error",
        message: errorMessage,
      });
    } finally {
      setIsUploading(false);
      setUploadPercentage(0);
    }
  };

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    console.log("File selected:", selectedFile);
    
    if (selectedFile) {
      // Validate file type if needed
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      
      if (!allowedTypes.includes(selectedFile.type)) {
        setPopup({
          open: true,
          severity: "warning",
          message: "Please select a PDF, Word document, or text file",
        });
        return;
      }
      
      // Validate file size (e.g., max 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (selectedFile.size > maxSize) {
        setPopup({
          open: true,
          severity: "warning",
          message: "File size must be less than 50MB",
        });
        return;
      }
      
      setFile(selectedFile);
      setUploadPercentage(0);
    }
  };

  // Add download functionality
  const handleDownload = async () => {
    if (!displayValue) {
      setPopup({
        open: true,
        severity: "warning",
        message: "No file to download",
      });
      return;
    }

    try {
      // Fix the URL construction - remove double slash and use correct path
      const downloadUrl = `${uploadTo.replace('/uploads/', '/download/')}//${displayValue}`.replace('//', '/');
      console.log("Downloading from:", downloadUrl);
      
      const response = await Axios.get(downloadUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Extract original filename from the stored filename
      const originalName = displayValue.split('_').slice(2).join('_') || displayValue;
      link.setAttribute('download', originalName);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setPopup({
        open: true,
        severity: "success",
        message: "File downloaded successfully",
      });

    } catch (error) {
      console.error("Download failed:", error);
      setPopup({
        open: true,
        severity: "error",
        message: "Download failed: " + (error.response?.data?.message || error.message),
      });
    }
  };

  return (
    <Grid container item xs={12} direction="column" className={props.className}>
      <Grid container item xs={12} spacing={0}>
        <Grid item xs={3}>
          <Button
            variant="contained"
            color="primary"
            component="label"
            disabled={isUploading}
            style={{ width: "100%", height: "100%" }}
          >
            {props.icon}
            <input
              type="file"
              style={{ display: "none" }}
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.txt"
              disabled={isUploading}
            />
          </Button>
        </Grid>
        <Grid item xs={displayValue && !file ? 4 : 6}>
          <TextField
            label={props.label}
            value={file ? file.name : (displayValue || "")}
            InputProps={{
              readOnly: true,
            }}
            variant="outlined"
            style={{ width: "100%" }}
            helperText={displayValue && !file ? "Previously uploaded file" : ""}
          />
        </Grid>
        {displayValue && !file && (
          <Grid item xs={2}>
            <Button
              variant="outlined"
              color="primary"
              style={{ width: "100%", height: "100%" }}
              onClick={handleDownload}
              title="Download file"
            >
              📥
            </Button>
          </Grid>
        )}
        <Grid item xs={displayValue && !file ? 3 : 3}>
          <Button
            variant="contained"
            color="secondary"
            style={{ width: "100%", height: "100%" }}
            onClick={handleUpload}
            disabled={!file || isUploading}
          >
            <CloudUpload />
            {isUploading ? " Uploading..." : " Upload"}
          </Button>
        </Grid>
      </Grid>
      {uploadPercentage > 0 && (
        <Grid item xs={12} style={{ marginTop: "10px" }}>
          <LinearProgress 
            variant="determinate" 
            value={uploadPercentage}
            style={{ height: "8px", borderRadius: "4px" }}
          />
          <div style={{ textAlign: "center", marginTop: "5px", fontSize: "12px" }}>
            {uploadPercentage}%
          </div>
        </Grid>
      )}
    </Grid>
  );
};

export default FileUploadInput;