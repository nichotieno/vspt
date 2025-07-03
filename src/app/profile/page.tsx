
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile } from '@/app/actions';

export default function ProfilePage() {
    const { user, setUser, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [investmentStrategy, setInvestmentStrategy] = useState('');
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        } else if (user) {
            setName(user.name || '');
            setEmail(user.email || '');
            setInvestmentStrategy(user.investmentStrategy || '');
        }
    }, [user, authLoading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        const result = await updateUserProfile(user.uid, name, investmentStrategy);
        setLoading(false);
        
        if (result.success) {
            const updatedUser = { ...user, name, investmentStrategy };
            setUser(updatedUser);
            localStorage.setItem('stocksim-user', JSON.stringify(updatedUser));
            toast({
                title: 'Profile Updated',
                description: 'Your profile has been successfully saved.',
            });
        } else {
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: result.error || 'An unknown error occurred.',
            });
        }
    };

    if (authLoading || !user) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p>Loading...</p>
            </div>
        );
    }
    
    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
                <Button asChild variant="outline" size="icon" className="h-7 w-7">
                  <Link href="/dashboard">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back</span>
                  </Link>
                </Button>
                <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                    My Profile
                </h1>
            </header>
            <main className="flex-1 p-4 sm:px-6 sm:py-6">
                <div className="mx-auto max-w-2xl">
                    <form onSubmit={handleSubmit}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Profile Information</CardTitle>
                                <CardDescription>Update your personal details and preferences.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" value={email} disabled />
                                    <p className="text-xs text-muted-foreground">Email address cannot be changed.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="strategy">Default Investment Strategy</Label>
                                    <Textarea
                                        id="strategy"
                                        value={investmentStrategy}
                                        onChange={(e) => setInvestmentStrategy(e.target.value)}
                                        placeholder="e.g., Long-term growth, value investing..."
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        This will be used as the default for AI-powered features.
                                    </p>
                                </div>
                            </CardContent>
                            <CardFooter className="border-t px-6 py-4">
                                <Button type="submit" disabled={loading}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </CardFooter>
                        </Card>
                    </form>
                </div>
            </main>
        </div>
    );
}
