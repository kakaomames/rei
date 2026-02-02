import adk.1;
import java.util.UUID;

public class adk implements aay<adb> {
   public static final aao<xq, adk> a = aay.a(adk::a, adk::new);
   private static final int b = 1;
   private static final int c = 2;
   private static final int d = 4;
   private final UUID e;
   private final adk.c f;
   static final adk.c g = new 1();

   private adk(UUID $$0, adk.c $$1) {
      this.e = $$0;
      this.f = $$1;
   }

   private adk(xq $$0) {
      this.e = $$0.n();
      adk.d $$1 = (adk.d)$$0.b(adk.d.class);
      this.f = (adk.c)$$1.g.decode($$0);
   }

   public static adk a(ccs $$0) {
      return new adk($$0.i(), new adk.a($$0));
   }

   public static adk a(UUID $$0) {
      return new adk($$0, g);
   }

   public static adk b(ccs $$0) {
      return new adk($$0.i(), new adk.f($$0.k()));
   }

   public static adk c(ccs $$0) {
      return new adk($$0.i(), new adk.e($$0.j()));
   }

   public static adk d(ccs $$0) {
      return new adk($$0.i(), new adk.h($$0.l(), $$0.m()));
   }

   public static adk e(ccs $$0) {
      return new adk($$0.i(), new adk.g($$0.n(), $$0.o(), $$0.p()));
   }

   private void a(xq $$0) {
      $$0.a(this.e);
      $$0.a(this.f.a());
      this.f.a($$0);
   }

   static int a(boolean $$0, boolean $$1, boolean $$2) {
      int $$3 = 0;
      if ($$0) {
         $$3 |= 1;
      }

      if ($$1) {
         $$3 |= 2;
      }

      if ($$2) {
         $$3 |= 4;
      }

      return $$3;
   }

   public aba<adk> a() {
      return ahz.k;
   }

   public void a(adb $$0) {
      $$0.a(this);
   }

   public void a(adk.b $$0) {
      this.f.a(this.e, $$0);
   }

   private interface c {
      adk.d a();

      void a(UUID var1, adk.b var2);

      void a(xq var1);
   }

   private static enum d {
      a(adk.a::new),
      b(($$0) -> {
         return adk.g;
      }),
      c(adk.f::new),
      d(adk.e::new),
      e(adk.h::new),
      f(adk.g::new);

      final aap<xq, adk.c> g;

      private d(final aap<xq, adk.c> param3) {
         this.g = $$0;
      }

      // $FF: synthetic method
      private static adk.d[] a() {
         return new adk.d[]{a, b, c, d, e, f};
      }
   }

   static class a implements adk.c {
      private final yh a;
      private final float b;
      private final ccs.a c;
      private final ccs.b d;
      private final boolean e;
      private final boolean f;
      private final boolean g;

      a(ccs $$0) {
         this.a = $$0.j();
         this.b = $$0.k();
         this.c = $$0.l();
         this.d = $$0.m();
         this.e = $$0.n();
         this.f = $$0.o();
         this.g = $$0.p();
      }

      private a(xq $$0) {
         this.a = (yh)yj.d.decode($$0);
         this.b = $$0.readFloat();
         this.c = (ccs.a)$$0.b(ccs.a.class);
         this.d = (ccs.b)$$0.b(ccs.b.class);
         int $$1 = $$0.readUnsignedByte();
         this.e = ($$1 & 1) > 0;
         this.f = ($$1 & 2) > 0;
         this.g = ($$1 & 4) > 0;
      }

      public adk.d a() {
         return adk.d.a;
      }

      public void a(UUID $$0, adk.b $$1) {
         $$1.a($$0, this.a, this.b, this.c, this.d, this.e, this.f, this.g);
      }

      public void a(xq $$0) {
         yj.d.encode($$0, this.a);
         $$0.a(this.b);
         $$0.a(this.c);
         $$0.a(this.d);
         $$0.l(adk.a(this.e, this.f, this.g));
      }
   }

   private static record f(float a) implements adk.c {
      private f(xq $$0) {
         this($$0.readFloat());
      }

      f(float param1) {
         this.a = $$0;
      }

      public adk.d a() {
         return adk.d.c;
      }

      public void a(UUID $$0, adk.b $$1) {
         $$1.a($$0, this.a);
      }

      public void a(xq $$0) {
         $$0.a(this.a);
      }

      public float b() {
         return this.a;
      }
   }

   static record e(yh a) implements adk.c {
      private e(xq $$0) {
         this((yh)yj.d.decode($$0));
      }

      e(yh param1) {
         this.a = $$0;
      }

      public adk.d a() {
         return adk.d.d;
      }

      public void a(UUID $$0, adk.b $$1) {
         $$1.a($$0, this.a);
      }

      public void a(xq $$0) {
         yj.d.encode($$0, this.a);
      }

      public yh b() {
         return this.a;
      }
   }

   static class h implements adk.c {
      private final ccs.a a;
      private final ccs.b b;

      h(ccs.a $$0, ccs.b $$1) {
         this.a = $$0;
         this.b = $$1;
      }

      private h(xq $$0) {
         this.a = (ccs.a)$$0.b(ccs.a.class);
         this.b = (ccs.b)$$0.b(ccs.b.class);
      }

      public adk.d a() {
         return adk.d.e;
      }

      public void a(UUID $$0, adk.b $$1) {
         $$1.a($$0, this.a, this.b);
      }

      public void a(xq $$0) {
         $$0.a(this.a);
         $$0.a(this.b);
      }
   }

   private static class g implements adk.c {
      private final boolean a;
      private final boolean b;
      private final boolean c;

      g(boolean $$0, boolean $$1, boolean $$2) {
         this.a = $$0;
         this.b = $$1;
         this.c = $$2;
      }

      private g(xq $$0) {
         int $$1 = $$0.readUnsignedByte();
         this.a = ($$1 & 1) > 0;
         this.b = ($$1 & 2) > 0;
         this.c = ($$1 & 4) > 0;
      }

      public adk.d a() {
         return adk.d.f;
      }

      public void a(UUID $$0, adk.b $$1) {
         $$1.a($$0, this.a, this.b, this.c);
      }

      public void a(xq $$0) {
         $$0.l(adk.a(this.a, this.b, this.c));
      }
   }

   public interface b {
      default void a(UUID $$0, yh $$1, float $$2, ccs.a $$3, ccs.b $$4, boolean $$5, boolean $$6, boolean $$7) {
      }

      default void a(UUID $$0) {
      }

      default void a(UUID $$0, float $$1) {
      }

      default void a(UUID $$0, yh $$1) {
      }

      default void a(UUID $$0, ccs.a $$1, ccs.b $$2) {
      }

      default void a(UUID $$0, boolean $$1, boolean $$2, boolean $$3) {
      }
   }
}
