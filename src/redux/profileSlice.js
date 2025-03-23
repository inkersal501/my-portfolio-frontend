import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Async thunk to fetch profile data
export const fetchProfile = createAsyncThunk("profile/fetchProfile", async () => {
    const response = await fetch(`${API_BASE_URL}/profile`);
    return response.json();
});

const profileSlice = createSlice({
    name: "profile",
    initialState: {
        data: {
            name: "",
            tagline: "",
            bio: "",
            description: "",
            last_updated: "",
            email: "",
            linkedin: "",
            github: "", 
            leetcode:"",
            hackerrank: "",
            crio: ""                        
        },  
    },
    reducers: {
        setProfile: (state, action) => {
            state.data = action.payload; 
        },
    }, 
});

export const { setProfile } = profileSlice.actions;
export default profileSlice.reducer;
