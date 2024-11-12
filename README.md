# PasswordManager
This project is licensed under the MIT license
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Introduction

This is a project where I, together with my team will be implementing a password manager ensuring it passes security tests.


## Getting Started
The following are the base requirements before installation and setup of the project.

- Node js >=

It provides a runtime environment that allows the running of JavaScript code outside of a web browser.

### Environment and Repository Setup
To begin the setup to your device. Move to the directory in which you would like to clone your project, e.g.,

     C:\Projects
Begin with cloning the project to your local repository.

     git clone https://github.com/Philip-O-M/PasswordManager.git

Press Enter to create your local clone.
Move to the password manager project directory, then navigate to the Front-End folder.

      cd pmanager/front 

Install the required frontend packages used in javascript programming and Nodejs.

      npm i

Navigate to the backend directory

      cd pmanager/server

Then install the required packages

      npm i

## Performing the tests
To run the tests, navigate to the starter folder as shown 
      cd Proj1_Starter
To run the test type the command below
      npm run test

You will see that all the 11 tests present will have passed.
## To run the server(backend)


Navigate to the backend 

	 cd pmanager/server

Start the server

	 npm run

## To run the frontend


Navigate to the frontend 

	 cd pmanager/front

Start the react application

	 npm run start

Then paste the following url in the browser 

	http://localhost:3001/signup

##Short Answer Questions

1.
The passwords are encrypted using AES-GCM, which is a modern and secure encryption algorithm. This ensures that the adversary cannot directly observe the plaintext passwords or their lengths; also the encryption process likely includes padding the plaintext password to a fixed block size before encryption. This ensures that the ciphertext length does not directly reveal the original password length.


2.
In a swap attack, the adversary is able to interchange the values corresponding to the different keys in the password manager. This means that the attacker swaps the credentials of one site with the credentials of another. For example, if the attacker controls www.evil.com, they could swap the credential with www.google.com and use the stolen credentials to access the google site.

This has been prevented through authentication encryption using AES-GCM. It provides both encryption and integrity protection, hence modification to the encrypted data through swapping will cause the decryption to fail. For example, if an attacker is able to modify the cipher text, the authentication tag will not match, thus the decryption process will not match leading to an error. It will ensure corrupted data is not mistaken for legitimate data.


3.
The rollback attacks are defended by storing the SHA-256 checksum of the serialized key-value store, which is used to verify if the integrity of the data has been maintained and to detect any tampering or rollback. It is necessary to assume the presence of a trusted location to store the checksum, for example a secure server. Without it, an adversary is capable of modifying the local key-value file and the checksum if they have access to it, hence rendering the integrity check useless, therefore it is essential to store it in a trusted location to prevent tampering.


4.
While using the randomized MAC, the biggest challenge would be the output changing for the same input, i.e., each time the MAC for a domain is computed, e.g., nytimes, the result would be different since the process is random. This would make the MAC impossible to use as the lookup key.
To deal with this, one would need to store both the randomized MAC and the domain in the key-value store and on each lookup, the MAC would have to be recalculated and compared against the stored MAC. It also means that multiple MAC values are needed to be stored for each domain, or store the value used in the computation of the MAC.

This could lead to penalties both in time and space complexity. In terms of time, the process would need to do more work in the lookup phase unlike in the deterministic MAC, hence it would take an increased amount of time to perform the same function. For the space complexity, you would need to store multiple MACs for a singular domain, O(m) as compared to one in the deterministic MAC, O(1). This will lead to a significant increase in the storage requirements.


5.
One way to reduce leaking the actual number of records is by using homomorphic encryption. This is a type of encryption where the data is converted into ciphertext which can be analyzed and worked on as if it were in its original form. This would make it harder to find out the information about the number of records. Order-preserving encryption can also be used as it allows for efficient inequality comparisons on the encrypted data without a need to decrypt them.

Lastly, another easier way would be to use dummy records. This could be achieved through padding. For example, we would pad in powers of 2, if there are 12 records, we would add 4 records to make it 16, if there are 16 records, we would add 16 records to make it 32 to ensure that there is at least 1 dummy in the information. This makes it difficult for an adversary to distinguish between true and dummy records.


6.
To implement the multi-user support for specific sites, it could be achieved using shared keys model. For a shared password for a specific site, e.g. nytimes, it would be encrypted using a shared key derived from the password of Alice and Bob allowing them to decrypt the password. For the other sites, they would have separate keys, thus ensuring that their access is only restricted to the passwords they share and doesn’t leak access to the passwords stored for individual users.  


