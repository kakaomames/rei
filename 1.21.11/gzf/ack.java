import io.netty.buffer.ByteBuf;
import java.util.List;

public record ack(amt<? extends jq<?>> b, List<ju.a> c) implements aay<ach> {
   private static final aao<ByteBuf, amt<? extends jq<?>>> d;
   public static final aao<wx, ack> a;

   public ack(amt<? extends jq<?>> param1, List<ju.a> param2) {
      this.b = $$0;
      this.c = $$1;
   }

   public aba<ack> a() {
      return aco.c;
   }

   public void a(ach $$0) {
      $$0.a(this);
   }

   public amt<? extends jq<?>> b() {
      return this.b;
   }

   public List<ju.a> e() {
      return this.c;
   }

   static {
      d = amo.b.a(amt::a, amt::a);
      a = aao.a(d, ack::b, ju.a.a.a(aam.a()), ack::e, ack::new);
   }
}
