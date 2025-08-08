import { Request, Response } from 'express';
import * as usersService from '../services/users_service';
import { handleError } from '../utils/handle_error';
import {registerUser} from "./auth_controller";

export const createUser = async (req: Request, res: Response): Promise<void> => {
    await registerUser(req, res);
};

export const getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const users = await usersService.getUsers();
        if (users.length === 0) {
            res.status(204).json([]);
        } else {
            res.json(users);
        }
    } catch (err) {
        handleError(err, res);
    }
};



export const getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await usersService.getUserById(req.params.id);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.json(user);
    } catch (err) {
        handleError(err, res);
    }
}


export const updateUserProfile = async (req: Request, res: Response) => {
    const { aboutMe, skills, selectedRole } = req.body;

    if (!req.params.id) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {
        const updatedUser = await usersService.updateUserProfile(req.params.id, aboutMe, skills, selectedRole);
        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(updatedUser);
    } catch (error) {
        handleError(error, res);
    }
};

export const updateUserById = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await usersService.updateUserById(req.params.id, req.body);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.json(user);
    } catch (err) {
        handleError(err, res);
    }
}


export const deleteUserById = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await usersService.deleteUserById(req.params.id);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        handleError(err, res);
    }
}
