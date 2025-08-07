import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserContext } from '../context/user.context'
import axios from '../config/axios'

const Register = () => {

    const [ email, setEmail ] = useState('')
    const [ password, setPassword ] = useState('')

    const { setUser } = useContext(UserContext)

    const navigate = useNavigate()


    function submitHandler(e) {

        e.preventDefault()

        axios.post('/users/register', {
            email,
            password
        }).then((res) => {
            console.log(res.data)
            localStorage.setItem('token', res.data.token)
            setUser(res.data.user)
            navigate('/')
        }).catch((err) => {
            console.log(err.response.data)
        })
    }


    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-blue-50 to-slate-100">
            {/* Left Side Illustration/Branding */}
            <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-gradient-to-br from-blue-600 to-purple-600 text-white p-12">
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                        <i className="ri-robot-line text-4xl"></i>
                    </div>
                    <h1 className="text-4xl font-bold mb-2">Ark AI Studio</h1>
                    <p className="text-lg text-white/80 text-center max-w-xs">Join the future of collaboration. Create your account!</p>
                </div>
            </div>
            {/* Right Side Form */}
            <div className="flex flex-1 items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-100">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Create your account</h2>
                    <form onSubmit={submitHandler} className="space-y-6">
                        <div>
                            <label className="block text-gray-700 mb-2 font-medium" htmlFor="email">Email</label>
                            <input
                                onChange={(e) => setEmail(e.target.value)}
                                type="email"
                                id="email"
                                className="w-full p-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                placeholder="Enter your email"
                                autoComplete="email"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-2 font-medium" htmlFor="password">Password</label>
                            <input
                                onChange={(e) => setPassword(e.target.value)}
                                type="password"
                                id="password"
                                className="w-full p-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                placeholder="Enter your password"
                                autoComplete="new-password"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full p-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg transition"
                        >
                            Register
                        </button>
                    </form>
                    <p className="text-gray-600 mt-6 text-center">
                        Already have an account?{' '}
                        <Link to="/login" className="text-blue-600 hover:underline font-medium">Login</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Register