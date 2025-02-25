# Wallet Share

Wallet Share is a decentralized smart wallet application that offers a role-based experience and on-chain governance. It enables secure fund management, personalized deposit tracking, and controlled access via smart contract features. The interface is built with React and ethers.js, enhanced by smooth Framer Motion animations and custom modal alerts.

<img width="1491" alt="Screenshot 2025-02-25 at 6 08 34 PM" src="https://github.com/user-attachments/assets/75fd601a-c8bf-4058-bd38-2ce45224ca74" />

## Owner vs. Member Experience

- **Owner (Admin) Experience:**
  - **Admin Panel:** Owners have exclusive access to an admin panel that allows them to set access restrictions, update transfer limits, and view a live, on-chain list of all users with granted access.
  - **Governance:** Owners can manage authorized voters and initiate multi-party voting to transfer wallet ownership.
  - **Exclusive Navigation:** The navigation bar adapts to show "Set Limit" and "Admin" tabs only when the connected account is recognized as the owner.

<img width="1489" alt="Screenshot 2025-02-25 at 6 08 52 PM" src="https://github.com/user-attachments/assets/207faf0e-f534-4498-9a4c-69b7d523c457" />

- **Member Experience:**
  - **Simplified Interface:** Non-owner users see a streamlined "Members" page with essential functions like depositing funds and transferring money, along with their personal on-chain deposit totals.
  - **Controlled Access:** Members operate under predefined limits and only access features approved by the owner.
 
<img width="1484" alt="Screenshot 2025-02-25 at 6 09 09 PM" src="https://github.com/user-attachments/assets/3a5bc03c-a519-48c0-8f31-6963b89d7db1" />

## Key Features

- **Decentralized Fund Management:**  
  Securely manages deposits and transfers through a Solidity smart contract that tracks user deposits on-chain.

- **On-Chain Access Control & Governance:**  
  The contract enables the owner to grant or revoke access for any address, maintain a dynamic on-chain access list, and run a voting process for owner transitions.

- **Responsive and Engaging UI:**  
  The React-based front-end uses ethers.js for blockchain interactions and Framer Motion for smooth transitions, animated elements (such as continuously flowing GIFs and dynamic deposit totals), and custom modal alerts.

- **Live On-Chain Data:**  
  Key data like user deposits and allowed access lists are retrieved directly from the blockchain, ensuring a decentralized and up-to-date experience.

## User Experience Overview

- **Login Screen:**  
  A visually engaging animated login page welcomes users with a custom GIF and a "Connect Wallet" button. The app remains on this screen until the user actively connects their wallet.

- **Home Screen:**  
  After connection, the home page displays the current wallet balance, dynamic animations, and custom alerts, with navigation that adapts based on the user role.

- **Deposit & Transfer Screens:**  
  - **Deposit:**  
    Users deposit funds, with every deposit recorded on-chain. The deposit screen features a split view where the left side shows the title and on-chain deposit total, while the right side displays an animated GIF and input fields.
  - **Transfer:**  
    The transfer screen provides an engaging UI with a smoothly oscillating image, dynamic balance updates, and easy-to-use transfer functionality.

- **Custom Alerts & Smooth Animations:**  
  Instead of default browser dialogs, custom modal alerts provide clear, branded notifications. Framer Motion delivers smooth, continuous animations across the app.

## License

This project is licensed under the MIT License.

---

*Wallet Share redefines the decentralized wallet experience by combining secure on-chain functionality with a polished, role-tailored user interface.*
