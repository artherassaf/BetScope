import React, { useEffect, useState } from 'react'; 
import { PlaidLink } from 'react-plaid-link';
import axios from 'axios';

const PlaidLinkButton = ({ onSuccess }) => {
    const [linkToken, setLinkToken] = useState(null);

    // Fetch the link token from the backend
    useEffect(() => {
        const createLinkToken = async () => {
            try {
                const response = await axios.post('http://127.0.0.1:8000/bets/create_link_token/');
                if (response.data && response.data.link_token) {
                    console.log("Link token received:", response.data.link_token);
                    setLinkToken(response.data.link_token); // Set the link token from backend response
                } else {
                    console.error("Link token not received from backend.");
                }
            } catch (error) {
                console.error('Error fetching link token:', error);
            }
        };

        createLinkToken(); // Call the function to fetch the link token
    }, []); // Ensures this runs only once when the component mounts

    // Ensure only one instance of PlaidLink is embedded
    if (!linkToken) {
        console.log("Waiting for link token...");
    }

    return (
        linkToken ? (
            <PlaidLink
                token={linkToken}
                onSuccess={async (public_token, metadata) => {
                    console.log('Plaid onSuccess triggered');
                    console.log('Public Token:', public_token);
                    console.log('Metadata:', metadata);

                    try {
                        // Send the public_token to the backend for token exchange
                        const response = await axios.post('http://127.0.0.1:8000/bets/exchange_public_token/', {
                            public_token: public_token,
                        });

                        console.log('Access Token Exchange Response:', response.data);

                        // If you want to notify the parent component, call onSuccess here
                        if (onSuccess) {
                            onSuccess(response.data.access_token); // Send access_token to parent
                        }
                    } catch (error) {
                        console.error('Error exchanging public token:', error);
                    }
                }}
                onExit={(error, metadata) => {
                    console.log('Plaid onExit triggered');
                    console.log('Exit Error:', error);
                    console.log('Exit Metadata:', metadata);
                }}
            >
                Connect Bank Account
            </PlaidLink>
        ) : (
            <button disabled>Loading...</button>
        )
    );
};

export default PlaidLinkButton;
