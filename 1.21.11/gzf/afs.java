import java.util.List;

public record afs(List<afs.a> b, boolean c) implements aay<adb> {
   public static final aao<xq, afs> a;

   public afs(List<afs.a> param1, boolean param2) {
      this.b = $$0;
      this.c = $$1;
   }

   public aba<afs> a() {
      return ahz.ap;
   }

   public void a(adb $$0) {
      $$0.a(this);
   }

   public List<afs.a> b() {
      return this.b;
   }

   public boolean e() {
      return this.c;
   }

   static {
      a = aao.a(afs.a.c.a(aam.a()), afs::b, aam.b, afs::e, afs::new);
   }

   public static record a(drz d, byte e) {
      public static final byte a = 1;
      public static final byte b = 2;
      public static final aao<xq, afs.a> c;

      public a(drz $$0, boolean $$1, boolean $$2) {
         this($$0, (byte)(($$1 ? 1 : 0) | ($$2 ? 2 : 0)));
      }

      public a(drz param1, byte param2) {
         this.d = $$0;
         this.e = $$1;
      }

      public boolean a() {
         return (this.e & 1) != 0;
      }

      public boolean b() {
         return (this.e & 2) != 0;
      }

      public drz c() {
         return this.d;
      }

      public byte d() {
         return this.e;
      }

      static {
         c = aao.a(drz.a, afs.a::c, aam.c, afs.a::d, afs.a::new);
      }
   }
}
