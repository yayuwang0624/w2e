'use client';

import * as React from 'react';

import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    Form,
} from '@heroui/react';

import { useAuth } from './AuthContext';

interface LoginModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function LoginModal({
    isOpen,
    onOpenChange,
}: LoginModalProps) {
    const { login } = useAuth();
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState<string | null>(
        null,
    );
    const [submitting, setSubmitting] = React.useState(false);

    const reset = () => {
        setUsername('');
        setPassword('');
        setError(null);
        setSubmitting(false);
    };

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            await login(username, password);
            reset();
            onOpenChange(false);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Login failed',
            );
            setSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            placement='center'
        >
            <ModalContent>
                {(onClose) => (
                    <Form
                        className='w-full'
                        onSubmit={handleSubmit}
                    >
                        <ModalHeader className='flex flex-col gap-1'>
                            Log in
                        </ModalHeader>
                        <ModalBody className='w-full'>
                            <Input
                                isRequired
                                autoFocus
                                label='Username'
                                value={username}
                                onValueChange={setUsername}
                            />
                            <Input
                                isRequired
                                label='Password'
                                type='password'
                                value={password}
                                onValueChange={setPassword}
                            />
                            {error && (
                                <p className='text-danger text-sm'>
                                    {error}
                                </p>
                            )}
                        </ModalBody>
                        <ModalFooter className='w-full'>
                            <Button
                                type='button'
                                variant='light'
                                onPress={onClose}
                            >
                                Cancel
                            </Button>
                            <Button
                                type='submit'
                                color='primary'
                                isLoading={submitting}
                            >
                                Log in
                            </Button>
                        </ModalFooter>
                    </Form>
                )}
            </ModalContent>
        </Modal>
    );
}
