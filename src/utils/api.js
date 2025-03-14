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
    .upsert({ ...profile, id: user.id });

  if (error) throw error;
  return data;
};

export const getDiseaseNames = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('diseases')
    .select('*')
    .eq('user_id', user.id);

  if (error) throw error;
  return data.map(disease => disease.name);
};

export const addDiseaseName = async (diseaseName) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('diseases')
    .insert([{ name: diseaseName, user_id: user.id }]);

  if (error) throw error;
  return data;
};

export const getParameters = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('parameters')
    .select('*')
    .eq('user_id', user.id);

  if (error) throw error;
  return data.map(param => param.name);
};

export const addParameter = async (parameter) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('parameters')
    .insert([{ name: parameter, user_id: user.id }]);

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