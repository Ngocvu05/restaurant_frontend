import axiosConfig from './axiosConfig';

interface Image {
  id: number;
  url: string;
  avatar: boolean;
}

export interface UserProfile {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phone_number: string;
  address: string;
  roleName: string;
  createdAt: string;
  avatar?: string;
  images?: Image[];
}

interface UpdateUserProfileRequest {
  fullName: string;
  email: string;
  phone_number: string;
  address: string;
  avatar: string;
}

export const UserApi = {
  getProfile: () => {
    return axiosConfig.get<UserProfile>('/users/profile');
  },

  updateProfile: (data: UpdateUserProfileRequest) => {
    return axiosConfig.put('/users/update', data);
  },

  setAvatar: (imageId: number) => {
    return axiosConfig.put(`/users/avatar/${imageId}`);
  },

  updateProfileWithAvatar: (data: UserProfile, avatarFile: File) => {
    const formData = new FormData();
    formData.append('fullName', data.fullName);
    formData.append('email', data.email);
    formData.append('phone_number', data.phone_number);
    formData.append('address', data.address);
    formData.append('avatar', avatarFile);

    return axiosConfig.put('/users/update', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};
