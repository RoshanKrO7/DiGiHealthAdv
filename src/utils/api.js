// utils/api.js
import {supabase} from './supabaseClient';

export const getUserProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('detailed_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) throw error;

  return data;
};


export const updateUserProfile = async (profile) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('detailed_profiles')
    .upsert({ ...profile, id: user.id })
    .select('*')
    .single();

  if (error) throw error;
  return data;
};

export const getDiseaseNames = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('user_diseases')
    .select('disease_name, id')
    .eq('user_id', user.id);

  if (error) throw error;
  return data;
};

export const addDiseaseName = async (diseaseName) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('user_diseases')
    .insert([{ 
      disease_name: diseaseName, 
      user_id: user.id,
      created_at: new Date().toISOString()
    }])
    .select();

  if (error) throw error;
  return data[0];
};

export const getParameters = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('health_parameters')
    .select('parameter_name, value, id')
    .eq('user_id', user.id);

  if (error) throw error;
  return data;
};

export const addParameter = async (parameterData) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('health_parameters')
    .insert([{ 
      parameter_name: parameterData.name,
      value: parameterData.value,
      user_id: user.id,
      created_at: new Date().toISOString()
    }])
    .select();

  if (error) throw error;
  return data[0];
};

export const getAllergies = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('user_allergies')
    .select('allergy_name, severity, id')
    .eq('user_id', user.id);

  if (error) throw error;
  return data;
};

export const addAllergy = async (allergyData) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('user_allergies')
    .insert([{ 
      allergy_name: allergyData.name,
      severity: allergyData.severity,
      user_id: user.id,
      created_at: new Date().toISOString()
    }])
    .select();

  if (error) throw error;
  return data[0];
};

export const getCommonDiseases = async () => {
  const { data, error } = await supabase
    .from('common_diseases')
    .select('name, category')
    .order('category', { ascending: true });

  if (error) throw error;
  return data;
};

export const handleProfilePictureUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('User not authenticated');
    return;
  }

  const fileName = `${user.id}-${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage
    .from('profile-pictures')
    .upload(fileName, file);

  if (error) {
    console.error('Error uploading profile picture:', error);
    return;
  }

  const { publicURL, error: urlError } = supabase.storage
    .from('profile-pictures')
    .getPublicUrl(fileName);

  if (urlError) {
    console.error('Error getting public URL:', urlError);
    return;
  }

  setProfile((prevProfile) => ({
    ...prevProfile,
    profile_picture: publicURL,
  }));
};