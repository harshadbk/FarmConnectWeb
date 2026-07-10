import React, { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import './FCommunity.css';

const socket = io('http://13.233.124.185', { transports: ['websocket'] });

const FCommunity = () => {
    const [name, setName] = useState(localStorage.getItem('user-name') || '');
    const [email, setEmail] = useState(localStorage.getItem('user-email') || '');
    const [role, setRole] = useState(localStorage.getItem('role') || 'User');
    const [message, setMessage] = useState('');
    const [groupMessages, setGroupMessages] = useState([]);
    const [privateMessages, setPrivateMessages] = useState([]);
    const [nearbyUsers, setNearbyUsers] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [joined, setJoined] = useState(false);
    const [notice, setNotice] = useState('');

    const currentUser = useMemo(() => ({
        name,
        email,
        role,
        latitude: Number(localStorage.getItem('user-lat')) || null,
        longitude: Number(localStorage.getItem('user-lon')) || null,
    }), [name, email, role]);

    useEffect(() => {
        if (!name || !email) return;
        socket.emit('register-user', currentUser);
        setJoined(true);

        socket.on('group-history', (history) => setGroupMessages(history));
        socket.on('group-message', (msg) => {
            setGroupMessages((prev) => [...prev, msg]);
            if (msg.email !== email) {
                setNotice(`${msg.sender} sent a message in the group`);
            }
        });
        socket.on('private-history', (history) => setPrivateMessages(history));
        socket.on('private-message', (msg) => {
            if (activeChat && (msg.fromEmail === activeChat.email || msg.toEmail === activeChat.email)) {
                setPrivateMessages((prev) => [...prev, msg]);
            }
            if (msg.fromEmail !== email) {
                setNotice(`New message from ${msg.sender}`);
            }
        });
        socket.on('private-message-sent', (msg) => setPrivateMessages((prev) => [...prev, msg]));

        const lat = Number(localStorage.getItem('user-lat'));
        const lon = Number(localStorage.getItem('user-lon'));
        if (email && !Number.isNaN(lat) && !Number.isNaN(lon)) {
            fetch(`http://13.233.124.185/api/chat/nearby-users?email=${encodeURIComponent(email)}&lat=${lat}&lon=${lon}`)
                .then((res) => res.json())
                .then((data) => setNearbyUsers(data.users || []))
                .catch(() => setNearbyUsers([]));
        } else if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                localStorage.setItem('user-lat', position.coords.latitude);
                localStorage.setItem('user-lon', position.coords.longitude);
                fetch(`http://13.233.124.185/api/chat/nearby-users?email=${encodeURIComponent(email)}&lat=${position.coords.latitude}&lon=${position.coords.longitude}`)
                    .then((res) => res.json())
                    .then((data) => setNearbyUsers(data.users || []))
                    .catch(() => setNearbyUsers([]));
            });
        }

        return () => {
            socket.off('group-history');
            socket.off('group-message');
            socket.off('private-history');
            socket.off('private-message');
            socket.off('private-message-sent');
        };
    }, [activeChat, currentUser, email, name]);

    const openChat = (user) => {
        setActiveChat(user);
        socket.emit('request-private-history', { fromEmail: email, toEmail: user.email });
    };

    const sendMessage = (e) => {
        e.preventDefault();
        if (!message.trim()) return;
        if (activeChat) {
            socket.emit('send-private-message', {
                toEmail: activeChat.email,
                fromEmail: email,
                text: message,
                name,
                role,
            });
        } else {
            socket.emit('send-group-message', {
                email,
                name,
                role,
                text: message,
            });
        }
        setMessage('');
    };

    return (
        <div className="community-shell">
            <div className="community-sidebar">
                <div className="community-header">
                    <h2>Farm Community</h2>
                    <p>{role} • {joined ? 'Online' : 'Connecting...'}</p>
                </div>

                <div className="community-section">
                    <h3>Group Chat</h3>
                    <button className={`chat-tab ${!activeChat ? 'active' : ''}`} onClick={() => setActiveChat(null)}>
                        All Users Group
                    </button>
                </div>

                <div className="community-section">
                    <h3>Nearby Users (within 20 km)</h3>
                    <div className="user-list">
                        {nearbyUsers.length > 0 ? nearbyUsers.map((user) => (
                            <button key={user.email} className={`user-card ${activeChat?.email === user.email ? 'active' : ''}`} onClick={() => openChat(user)}>
                                <strong>{user.name || user.email}</strong>
                                <span>{user.role || 'User'} • {user.distance} km</span>
                            </button>
                        )) : <p>No nearby users found yet.</p>}
                    </div>
                </div>
            </div>

            <div className="community-main">
                <div className="chat-header">
                    <h3>{activeChat ? `${activeChat.name || activeChat.email} (${activeChat.role || 'User'})` : 'All Users Group'}</h3>
                    <p>{activeChat ? 'Private chat' : 'Everyone can see this channel'}</p>
                </div>

                {notice && <div className="chat-notice">{notice}</div>}

                <div className="chat-body">
                    {(activeChat ? privateMessages : groupMessages).map((msg) => {
                        const isMine = msg.email === email || msg.fromEmail === email;
                        return (
                            <div key={msg.id} className={`chat-bubble ${isMine ? 'mine' : 'their'}`}>
                                <div className="chat-meta">
                                    <strong>{isMine ? 'You' : (msg.sender || msg.name || 'User')}</strong>
                                    {!isMine && <span>{msg.role || 'User'}</span>}
                                </div>
                                <div>{msg.text || msg.message}</div>
                            </div>
                        );
                    })}
                </div>

                <form className="chat-input-row" onSubmit={sendMessage}>
                    <input
                        type="text"
                        placeholder={activeChat ? `Message ${activeChat.name || activeChat.email}` : 'Message everyone in the farm group'}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                    <button type="submit">Send</button>
                </form>
            </div>
        </div>
    );
};

export default FCommunity;
