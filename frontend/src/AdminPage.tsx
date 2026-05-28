import React, { useEffect, useState } from 'react';
import { useAxios } from '@/useAxios.tsx';
import { useAuth } from '@/useAuth.tsx';
import { JwtResponse } from '@/types.ts';
import { useNavigate } from "react-router-dom";

interface BotDto {
  id: number;
  name: string;
  email: string;
}

const AdminPage = () => {
  const navigate = useNavigate();
  const api = useAxios();
  const { becomeBot } = useAuth();
  const [bots, setBots] = useState<BotDto[]>([]);
  const [newBotName, setNewBotName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchBots = async () => {
    try {
      const res = await api.get<BotDto[]>('/admin/bots');
      setBots(res.data);
    } catch {
      setError('Failed to load bots.');
    }
  };

  const handleCreateBot = async (e: React.SubmitEvent) => {
    e.preventDefault();
    try {
      const res = await api.post<BotDto>('/admin/bots', { name: newBotName });
      setNewBotName('');
      setError(null);
      setBots(prev => [...prev, res.data]);
    } catch {
      setError('Failed to create bot.');
    }
  };

  const handleBecome = async (bot: BotDto) => {
    try {
      const res = await api.post<JwtResponse>(`/admin/bots/${bot.id}/token`);
      await becomeBot(res.data.token, bot.name);
      navigate("/");
    } catch {
      setError('Failed to become bot.');
    }
  };

  useEffect(() => {
    fetchBots().then();
  }, []);

  return (
    <div className="content">
      <h2>Admin</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h3>Bots</h3>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {bots.map((bot) => (
            <tr key={bot.id}>
              <td>{bot.name}</td>
              <td>{bot.email}</td>
              <td>
                <button onClick={() => handleBecome(bot)}>Become</button>
              </td>
            </tr>
          ))}
          {bots.length === 0 && (
            <tr>
              <td colSpan={3}>No bots yet.</td>
            </tr>
          )}
        </tbody>
      </table>

      <h3>Create Bot</h3>
      <form onSubmit={handleCreateBot}>
        <input
          type="text"
          value={newBotName}
          onChange={(e) => setNewBotName(e.target.value)}
          placeholder="Bot name"
          required
        />
        <button type="submit">Create</button>
      </form>
    </div>
  );
};

export default AdminPage;
