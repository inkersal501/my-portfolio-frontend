import axios from "axios";
import API_ENDPOINT from "../config";


const fetchProfile = async ()=>{
    const response = await axios.get(`${API_ENDPOINT}/profile`);
    return response.data;
};

const fetchAbout = async ()=>{
    const response = await axios.get(`${API_ENDPOINT}/about`);
    return response.data;
};

const fetchSkills = async ()=> {
    const response = await axios.get(`${API_ENDPOINT}/skills`);
    return response.data;
}


const fetchExperience = async ()=> {
    const response = await axios.get(`${API_ENDPOINT}/experience`);
    return response.data;
}
const fetchCertifications = async ()=> {
    const response = await axios.get(`${API_ENDPOINT}/certifications`);
    return response.data;
}
const fetchProjects = async ()=>{
    const response = await axios.get(`${API_ENDPOINT}/projects`);
    return response.data;
}
const fetchFaqs = async ()=>{
    const response = await axios.get(`${API_ENDPOINT}/faqs`);
    return response.data;
}

export {fetchProfile, fetchAbout, fetchSkills, fetchExperience, fetchCertifications, fetchProjects, fetchFaqs, };