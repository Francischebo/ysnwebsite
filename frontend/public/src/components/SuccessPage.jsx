
useEffect(() => {
    const timer = setTimeout(() => {
        window.location.href = "/";
    }, 5000); // Redirect after 5 seconds

    return () => clearTimeout(timer);
}, []);