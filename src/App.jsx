import "bootstrap/dist/css/bootstrap.min.css";

import React from "react";
import { OpenCvProvider } from "opencv-react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";


import ErrorPage from "./components/ErrorPage";

import HuffmanPage from "./components/HuffmanPage";

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <HuffmanPage />,
        errorElement: <ErrorPage />,  
    },


    
  ]);

  return (
    <OpenCvProvider>
      <RouterProvider router={router} />
    </OpenCvProvider>
  );
}

export default App;
