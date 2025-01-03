"use client";

import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

        <div className="prose dark:prose-invert max-w-none">
          <p className="text-lg mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Overview</h2>
            <p>
              Elongatd is a browser extension that helps users convert Twitter/X
              threads into readable blog posts. We are committed to protecting
              your privacy and being transparent about our data practices.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              Information We Collect
            </h2>
            <p>
              We collect and process the following information when you use our
              extension:
            </p>
            <ul className="list-disc pl-6 mt-2">
              <li>
                <strong>Website Content:</strong> When you choose to convert a
                thread, we collect the publicly available content of the
                Twitter/X thread, including text, images, videos, and links.
                This is only done when you explicitly click to create a blog
                version of a thread.
              </li>
              <li>
                <strong>Authentication:</strong> We store a session token
                locally to maintain your login state with our service. We do not
                collect or store passwords or other credentials.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              How We Use Information
            </h2>
            <p>The information we collect is used solely to:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>Convert Twitter/X threads into blog posts at your request</li>
              <li>Maintain your session state with our service</li>
              <li>Improve the functionality of our extension</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Data Storage</h2>
            <p>
              All thread content is stored on our secure servers. Your session
              token is stored locally in your browser. We do not sell or share
              your data with third parties.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>Access the blog posts you&apos;ve created</li>
              <li>Delete your account and associated data</li>
              <li>Opt out of using our service at any time</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Contact</h2>
            <p>
              If you have any questions about this Privacy Policy, please
              contact us at{" "}
              <a
                href="mailto:danielcarmona55@gmail.com"
                className="text-blue-400 hover:text-blue-300"
              >
                danielcarmona55@gmail.com
              </a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. We will
              notify you of any changes by posting the new Privacy Policy on
              this page.
            </p>
          </section>
        </div>

        <div className="mt-12 border-t pt-8">
          <Link href="/" className="text-blue-400 hover:text-blue-300">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
