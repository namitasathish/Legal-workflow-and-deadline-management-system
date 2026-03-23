import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Keep it simple: log so you can debug in dev console.
    // eslint-disable-next-line no-console
    console.error('App crashed in a screen:', error, info);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const message = this.state.error?.message || 'An unexpected error occurred.';

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.message}>{message}</Text>
        <TouchableOpacity onPress={this.reset} style={styles.button}>
          <Text style={styles.buttonText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    color: '#6b7280',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 18,
  },
  button: {
    backgroundColor: '#111827',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 13,
  },
});

