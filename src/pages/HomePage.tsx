import { SignedOut, SignInButton, SignUpButton, useUser } from '@clerk/clerk-react';

const HomePage = () => {
	const { isSignedIn } = useUser();

	console.log(`${isSignedIn} home`)
	return (
		<div>
			<h2> Hola a todos </h2>

			<SignedOut>
				<div className="flex justify-end items-center p-4 gap-4 h-16">
					<SignInButton forceRedirectUrl={'/user/dashboard'}>
						<button> Iniciar sesión</button>
					</SignInButton>
					<SignUpButton>
						<button>Registrar</button>
					</SignUpButton>
				</div>
			</SignedOut>
		</div>
	);
};

export default HomePage;
